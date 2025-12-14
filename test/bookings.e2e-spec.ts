import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { Connection, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Bookings (e2e)', () => {
  let app: INestApplication<App>;
  let connection: Connection;
  let authToken: string;
  let serviceId: string;
  let createdBookingId: string;

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
        email: 'bookings-admin@test.com',
        password: 'Test123!@#',
        name: 'Bookings Test Admin',
      });

    authToken = registerResponse.body.accessToken;

    // Create a service for booking tests
    const serviceResponse = await request(app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Manicure',
        description: 'Classic manicure',
        price: 25,
        duration: 30,
        category: 'manicure',
      });

    serviceId = serviceResponse.body._id;
  });

  afterAll(async () => {
    // Cleanup database
    await connection.collection('bookings').deleteMany({});
    await connection.collection('services').deleteMany({});
    await connection.collection('admins').deleteMany({});
    await app.close();
  });

  describe('POST /bookings', () => {
    it('should create a booking without auth (public route)', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const response = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          serviceId: serviceId,
          date: futureDate.toISOString().split('T')[0],
          timeSlot: '10:00',
          customerInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+1234567890',
          },
          notes: 'Please use organic products',
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.timeSlot).toBe('10:00');
      expect(response.body.customerInfo.firstName).toBe('John');
      expect(response.body.status).toBe('pending');

      createdBookingId = response.body._id;
    });

    it('should return 400 with invalid service ID', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await request(app.getHttpServer())
        .post('/bookings')
        .send({
          serviceId: 'invalid-id',
          date: futureDate.toISOString().split('T')[0],
          timeSlot: '11:00',
          customerInfo: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            phone: '+0987654321',
          },
        })
        .expect(400);
    });

    it('should return 400 with invalid time slot format', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await request(app.getHttpServer())
        .post('/bookings')
        .send({
          serviceId: serviceId,
          date: futureDate.toISOString().split('T')[0],
          timeSlot: '25:00', // Invalid hour
          customerInfo: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            phone: '+0987654321',
          },
        })
        .expect(400);
    });

    it('should return 400 with invalid email', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await request(app.getHttpServer())
        .post('/bookings')
        .send({
          serviceId: serviceId,
          date: futureDate.toISOString().split('T')[0],
          timeSlot: '12:00',
          customerInfo: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'invalid-email', // Invalid email
            phone: '+0987654321',
          },
        })
        .expect(400);
    });

    it('should return 400 with missing required customer info fields', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await request(app.getHttpServer())
        .post('/bookings')
        .send({
          serviceId: serviceId,
          date: futureDate.toISOString().split('T')[0],
          timeSlot: '13:00',
          customerInfo: {
            firstName: 'Jane',
            // missing lastName, email, phone
          },
        })
        .expect(400);
    });

    it('should return 409 when time slot already booked', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await request(app.getHttpServer())
        .post('/bookings')
        .send({
          serviceId: serviceId,
          date: futureDate.toISOString().split('T')[0],
          timeSlot: '10:00', // Same time slot as first booking
          customerInfo: {
            firstName: 'Alice',
            lastName: 'Johnson',
            email: 'alice@example.com',
            phone: '+1122334455',
          },
        })
        .expect(409);
    });
  });

  describe('GET /bookings', () => {
    beforeAll(async () => {
      // Create additional bookings for pagination tests
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 8);

      await request(app.getHttpServer())
        .post('/bookings')
        .send({
          serviceId: serviceId,
          date: futureDate.toISOString().split('T')[0],
          timeSlot: '14:00',
          customerInfo: {
            firstName: 'Bob',
            lastName: 'Wilson',
            email: 'bob@example.com',
            phone: '+2233445566',
          },
        });
    });

    it('should return 401 without auth token (protected route)', async () => {
      await request(app.getHttpServer()).get('/bookings').expect(401);
    });

    it('should return all bookings with auth', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return paginated bookings', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.data.length).toBe(1);
    });

    it('should filter bookings by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings?status=pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.every((b: any) => b.status === 'pending')).toBe(
        true,
      );
    });

    it('should filter bookings by service ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/bookings?serviceId=${serviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter bookings by date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      const response = await request(app.getHttpServer())
        .get(`/bookings?date=${dateString}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return 400 with invalid service ID filter', async () => {
      await request(app.getHttpServer())
        .get('/bookings?serviceId=invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /bookings/:id', () => {
    it('should return 401 without auth token (protected route)', async () => {
      await request(app.getHttpServer())
        .get(`/bookings/${createdBookingId}`)
        .expect(401);
    });

    it('should return a single booking with auth', async () => {
      const response = await request(app.getHttpServer())
        .get(`/bookings/${createdBookingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body._id).toBe(createdBookingId);
      expect(response.body.timeSlot).toBe('10:00');
    });

    it('should return 400 with invalid booking ID', async () => {
      await request(app.getHttpServer())
        .get('/bookings/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should return 404 for non-existent booking', async () => {
      const fakeId = new Types.ObjectId().toString();
      await request(app.getHttpServer())
        .get(`/bookings/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /bookings/:id/status', () => {
    it('should return 401 without auth token (protected route)', async () => {
      await request(app.getHttpServer())
        .patch(`/bookings/${createdBookingId}/status`)
        .send({ status: 'confirmed' })
        .expect(401);
    });

    it('should update booking status with auth', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/bookings/${createdBookingId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'confirmed' })
        .expect(200);

      expect(response.body.status).toBe('confirmed');
    });

    it('should return 400 with invalid status', async () => {
      await request(app.getHttpServer())
        .patch(`/bookings/${createdBookingId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid-status' })
        .expect(400);
    });

    it('should return 400 with invalid booking ID', async () => {
      await request(app.getHttpServer())
        .patch('/bookings/invalid-id/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'cancelled' })
        .expect(400);
    });

    it('should return 404 for non-existent booking', async () => {
      const fakeId = new Types.ObjectId().toString();
      await request(app.getHttpServer())
        .patch(`/bookings/${fakeId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'cancelled' })
        .expect(404);
    });
  });
});
