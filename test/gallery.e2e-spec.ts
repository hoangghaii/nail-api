import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { Connection, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Gallery (e2e)', () => {
  let app: INestApplication<App>;
  let connection: Connection;
  let authToken: string;
  let createdGalleryId: string;

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

    // Clean database before tests
    await connection.collection('admins').deleteMany({});
    await connection.collection('services').deleteMany({});
    await connection.collection('bookings').deleteMany({});
    await connection.collection('galleries').deleteMany({});
    await connection.collection('banners').deleteMany({});
    await connection.collection('contacts').deleteMany({});

    // Register admin and get auth token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'gallery-admin@test.com',
        password: 'Test123!@#',
        name: 'Gallery Test Admin',
      });

    authToken = registerResponse.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup database
    await connection.collection('galleries').deleteMany({});
    await connection.collection('admins').deleteMany({});
    await app.close();
  });

  describe('POST /gallery', () => {
    it('should create a gallery item with valid auth', async () => {
      const response = await request(app.getHttpServer())
        .post('/gallery')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/image1.jpg',
          title: 'Beautiful Nails',
          description: 'Artistic nail design',
          category: 'nail-art',
          featured: true,
          isActive: true,
          sortIndex: 1,
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.imageUrl).toBe('https://example.com/image1.jpg');
      expect(response.body.title).toBe('Beautiful Nails');
      expect(response.body.category).toBe('nail-art');
      expect(response.body.featured).toBe(true);

      createdGalleryId = response.body._id;
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/gallery')
        .send({
          imageUrl: 'https://example.com/image2.jpg',
          title: 'Elegant Design',
          category: 'nail-art',
        })
        .expect(401);
    });

    it('should return 400 with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/gallery')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/image3.jpg',
          // missing title and category
        })
        .expect(400);
    });

    it('should return 400 with empty title', async () => {
      await request(app.getHttpServer())
        .post('/gallery')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/image4.jpg',
          title: '', // Empty title
          category: 'nail-art',
        })
        .expect(400);
    });
  });

  describe('GET /gallery', () => {
    beforeAll(async () => {
      // Create additional gallery items for pagination tests
      await request(app.getHttpServer())
        .post('/gallery')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/image5.jpg',
          title: 'French Manicure',
          description: 'Classic french style',
          category: 'manicure',
          featured: false,
          isActive: true,
        });

      await request(app.getHttpServer())
        .post('/gallery')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/image6.jpg',
          title: 'Gel Nails Art',
          description: 'Creative gel nail art',
          category: 'nail-art',
          featured: true,
          isActive: true,
        });
    });

    it('should return all gallery items without auth (public route)', async () => {
      const response = await request(app.getHttpServer())
        .get('/gallery')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return paginated gallery items', async () => {
      const response = await request(app.getHttpServer())
        .get('/gallery?page=1&limit=2')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should filter gallery items by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/gallery?category=nail-art')
        .expect(200);

      expect(
        response.body.data.every((g: any) => g.category === 'nail-art'),
      ).toBe(true);
    });

    it('should filter gallery items by featured status', async () => {
      const response = await request(app.getHttpServer())
        .get('/gallery?featured=true')
        .expect(200);

      expect(response.body.data.every((g: any) => g.featured === true)).toBe(
        true,
      );
    });

    it('should filter gallery items by active status', async () => {
      const response = await request(app.getHttpServer())
        .get('/gallery?isActive=true')
        .expect(200);

      expect(response.body.data.every((g: any) => g.isActive === true)).toBe(
        true,
      );
    });
  });

  describe('GET /gallery/:id', () => {
    it('should return a single gallery item without auth (public route)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/gallery/${createdGalleryId}`)
        .expect(200);

      expect(response.body._id).toBe(createdGalleryId);
      expect(response.body.title).toBe('Beautiful Nails');
    });

    it('should return 404 for non-existent gallery item', async () => {
      const fakeId = new Types.ObjectId().toString();
      await request(app.getHttpServer()).get(`/gallery/${fakeId}`).expect(404);
    });
  });

  describe('PATCH /gallery/:id', () => {
    it('should update a gallery item with valid auth', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/gallery/${createdGalleryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Beautiful Nails',
          description: 'Updated artistic nail design',
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Beautiful Nails');
      expect(response.body.description).toBe('Updated artistic nail design');
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .patch(`/gallery/${createdGalleryId}`)
        .send({ title: 'Another Update' })
        .expect(401);
    });

    it('should return 404 for non-existent gallery item', async () => {
      const fakeId = new Types.ObjectId().toString();
      await request(app.getHttpServer())
        .patch(`/gallery/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Update' })
        .expect(404);
    });
  });

  describe('DELETE /gallery/:id', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .delete(`/gallery/${createdGalleryId}`)
        .expect(401);
    });

    it('should delete a gallery item with valid auth', async () => {
      await request(app.getHttpServer())
        .delete(`/gallery/${createdGalleryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/gallery/${createdGalleryId}`)
        .expect(404);
    });

    it('should return 404 for non-existent gallery item', async () => {
      const fakeId = new Types.ObjectId().toString();
      await request(app.getHttpServer())
        .delete(`/gallery/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
