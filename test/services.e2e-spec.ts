import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { Connection, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Services (e2e)', () => {
  let app: INestApplication<App>;
  let connection: Connection;
  let authToken: string;
  let createdServiceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());

    // Register admin and get auth token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@test.com',
        password: 'Test123!@#',
        name: 'Test Admin',
      });

    authToken = registerResponse.body.tokens.accessToken;
  });

  afterAll(async () => {
    // Cleanup database
    await connection.collection('services').deleteMany({});
    await connection.collection('admins').deleteMany({});
    await app.close();
  });

  describe('POST /services', () => {
    it('should create a new service with valid auth', async () => {
      const response = await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Manicure',
          description: 'Classic manicure service',
          price: 25,
          duration: 30,
          category: 'nails',
          featured: true,
          isActive: true,
          sortIndex: 1,
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe('Manicure');
      expect(response.body.price).toBe(25);
      expect(response.body.duration).toBe(30);
      expect(response.body.category).toBe('nails');
      expect(response.body.featured).toBe(true);

      createdServiceId = response.body._id;
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/services')
        .send({
          name: 'Pedicure',
          description: 'Relaxing pedicure',
          price: 35,
          duration: 45,
          category: 'nails',
        })
        .expect(401);
    });

    it('should return 400 with invalid data (missing required fields)', async () => {
      await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Incomplete Service',
          // missing description, price, duration, category
        })
        .expect(400);
    });

    it('should return 400 with invalid duration (less than 15)', async () => {
      await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Fast Service',
          description: 'Too fast',
          price: 10,
          duration: 10, // Invalid: less than 15
          category: 'nails',
        })
        .expect(400);
    });

    it('should return 400 with negative price', async () => {
      await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Free Service',
          description: 'Free service',
          price: -5, // Invalid: negative price
          duration: 30,
          category: 'nails',
        })
        .expect(400);
    });

    it('should return 409 when creating duplicate service name', async () => {
      await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Manicure', // Duplicate name
          description: 'Another manicure',
          price: 30,
          duration: 30,
          category: 'nails',
        })
        .expect(409);
    });
  });

  describe('GET /services', () => {
    beforeAll(async () => {
      // Create additional services for pagination tests
      await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Pedicure',
          description: 'Relaxing pedicure',
          price: 35,
          duration: 45,
          category: 'nails',
          featured: false,
          isActive: true,
        });

      await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Gel Nails',
          description: 'Long-lasting gel nails',
          price: 50,
          duration: 60,
          category: 'nails',
          featured: true,
          isActive: true,
        });
    });

    it('should return all services without auth (public route)', async () => {
      const response = await request(app.getHttpServer())
        .get('/services')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return paginated services', async () => {
      const response = await request(app.getHttpServer())
        .get('/services?page=1&limit=2')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should filter services by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/services?category=nails')
        .expect(200);

      expect(response.body.data.every((s: any) => s.category === 'nails')).toBe(
        true,
      );
    });

    it('should filter services by featured status', async () => {
      const response = await request(app.getHttpServer())
        .get('/services?featured=true')
        .expect(200);

      expect(response.body.data.every((s: any) => s.featured === true)).toBe(
        true,
      );
    });

    it('should filter services by active status', async () => {
      const response = await request(app.getHttpServer())
        .get('/services?isActive=true')
        .expect(200);

      expect(response.body.data.every((s: any) => s.isActive === true)).toBe(
        true,
      );
    });
  });

  describe('GET /services/:id', () => {
    it('should return a single service without auth (public route)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/services/${createdServiceId}`)
        .expect(200);

      expect(response.body._id).toBe(createdServiceId);
      expect(response.body.name).toBe('Manicure');
    });

    it('should return 404 for non-existent service', async () => {
      const fakeId = new Types.ObjectId().toString();
      await request(app.getHttpServer()).get(`/services/${fakeId}`).expect(404);
    });
  });

  describe('PATCH /services/:id', () => {
    it('should update a service with valid auth', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/services/${createdServiceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          price: 30,
          description: 'Updated classic manicure service',
        })
        .expect(200);

      expect(response.body.price).toBe(30);
      expect(response.body.description).toBe(
        'Updated classic manicure service',
      );
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .patch(`/services/${createdServiceId}`)
        .send({ price: 35 })
        .expect(401);
    });

    it('should return 404 for non-existent service', async () => {
      const fakeId = new Types.ObjectId().toString();
      await request(app.getHttpServer())
        .patch(`/services/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ price: 30 })
        .expect(404);
    });
  });

  describe('DELETE /services/:id', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .delete(`/services/${createdServiceId}`)
        .expect(401);
    });

    it('should delete a service with valid auth', async () => {
      await request(app.getHttpServer())
        .delete(`/services/${createdServiceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/services/${createdServiceId}`)
        .expect(404);
    });

    it('should return 404 for non-existent service', async () => {
      const fakeId = new Types.ObjectId().toString();
      await request(app.getHttpServer())
        .delete(`/services/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
