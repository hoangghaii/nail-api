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
    await connection.collection('gallerycategories').deleteMany({});
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
    await connection.collection('gallerycategories').deleteMany({});
    await connection.collection('admins').deleteMany({});
    await app.close();
  });

  // Seed categories for tests
  let allCategoryId: string;
  let nailArtCategoryId: string;

  beforeAll(async () => {
    // Seed "all" category
    const allCat = await request(app.getHttpServer())
      .post('/gallery-categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'All', slug: 'all' });
    allCategoryId = allCat.body._id;

    // Seed "nail-art" category
    const nailArtCat = await request(app.getHttpServer())
      .post('/gallery-categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Nail Art', slug: 'nail-art' });
    nailArtCategoryId = nailArtCat.body._id;
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
          price: '$50',
          duration: '60 minutes',
          featured: true,
          isActive: true,
          sortIndex: 1,
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.imageUrl).toBe('https://example.com/image1.jpg');
      expect(response.body.title).toBe('Beautiful Nails');
      expect(response.body.price).toBe('$50');
      expect(response.body.duration).toBe('60 minutes');
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
          price: '$45',
          duration: '45 minutes',
        })
        .expect(401);
    });

    it('should return 400 with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/gallery')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/image3.jpg',
          // missing title, price, and duration
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
          price: '$50',
          duration: '60 minutes',
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
          price: '$40',
          duration: '45 minutes',
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
          price: '$55',
          duration: '75 minutes',
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

  describe('Gallery with Categories Integration', () => {
    describe('POST /gallery with categoryId', () => {
      it('should create gallery with categoryId', async () => {
        const response = await request(app.getHttpServer())
          .post('/gallery')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            imageUrl: 'https://example.com/test.jpg',
            title: 'Test Gallery',
            categoryId: nailArtCategoryId,
            price: '$50',
            duration: '60 min',
          })
          .expect(201);

        expect(response.body.categoryId).toBeDefined();
        expect(response.body.categoryId._id).toBe(nailArtCategoryId);
      });

      it('should auto-assign "all" category when categoryId not provided', async () => {
        const response = await request(app.getHttpServer())
          .post('/gallery')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            imageUrl: 'https://example.com/test2.jpg',
            title: 'Test Gallery 2',
            price: '$45',
            duration: '45 min',
          })
          .expect(201);

        expect(response.body.categoryId).toBeDefined();
        expect(response.body.categoryId._id).toBe(allCategoryId);
      });

      it('should validate categoryId exists', async () => {
        const fakeId = new Types.ObjectId().toString();
        await request(app.getHttpServer())
          .post('/gallery')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            imageUrl: 'https://example.com/test3.jpg',
            title: 'Test Gallery 3',
            categoryId: fakeId,
            price: '$50',
            duration: '60 min',
          })
          .expect(404);
      });

      it('should require price and duration fields', async () => {
        await request(app.getHttpServer())
          .post('/gallery')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            imageUrl: 'https://example.com/test4.jpg',
            title: 'Test Gallery 4',
          })
          .expect(400);
      });
    });

    describe('GET /gallery with categoryId filter', () => {
      beforeAll(async () => {
        // Create galleries with different categories
        await request(app.getHttpServer())
          .post('/gallery')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            imageUrl: 'https://example.com/cat1.jpg',
            title: 'Category Test 1',
            categoryId: nailArtCategoryId,
            price: '$50',
            duration: '60 min',
          });

        await request(app.getHttpServer())
          .post('/gallery')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            imageUrl: 'https://example.com/cat2.jpg',
            title: 'Category Test 2',
            categoryId: allCategoryId,
            price: '$45',
            duration: '45 min',
          });
      });

      it('should filter galleries by categoryId', async () => {
        const response = await request(app.getHttpServer())
          .get(`/gallery?categoryId=${nailArtCategoryId}`)
          .expect(200);

        expect(response.body.data.length).toBeGreaterThan(0);
        expect(
          response.body.data.every(
            (g: any) => g.categoryId._id === nailArtCategoryId,
          ),
        ).toBe(true);
      });

      it('should populate category details in response', async () => {
        const response = await request(app.getHttpServer())
          .get('/gallery')
          .expect(200);

        const gallery = response.body.data[0];
        expect(gallery.categoryId).toBeDefined();
        expect(gallery.categoryId._id).toBeDefined();
        expect(gallery.categoryId.name).toBeDefined();
        expect(gallery.categoryId.slug).toBeDefined();
      });
    });
  });
});
