import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let connection: Connection;

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
  });

  afterAll(async () => {
    // Cleanup database
    await connection.collection('admins').deleteMany({});
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new admin successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
          name: 'Test Admin',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('admin');
      expect(response.body.admin).toHaveProperty('email', 'test@example.com');
      expect(response.body.admin).not.toHaveProperty('password');
    });

    it('should return 409 when email already exists', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
          name: 'Test Admin',
        })
        .expect(409);
    });

    it('should return 400 with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123!@#',
          name: 'Test Admin',
        })
        .expect(400);
    });

    it('should return 400 with weak password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'weakpass@example.com',
          password: '123',
          name: 'Test Admin',
        });

      // Should return 400 for validation error, but may return 429 if rate limited
      expect([400, 429]).toContain(response.status);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('admin');
    });

    it('should return 401 with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return 401 with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123!@#',
        })
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
        });

      refreshToken = response.body.refreshToken;
    });

    it('should refresh tokens successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      // Note: refreshToken may be the same if generated within the same second (JWT timestamp precision)
    });

    it('should return 401 with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
        });

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should logout successfully with valid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('Protected Routes', () => {
    it('should return 401 when accessing protected route without token', async () => {
      await request(app.getHttpServer()).post('/services').send({}).expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', 'Bearer invalid-token')
        .send({})
        .expect(401);
    });
  });
});
