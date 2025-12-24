import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { Connection, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('GalleryCategory (e2e)', () => {
  let app: INestApplication<App>;
  let connection: Connection;
  let authToken: string;

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
    await connection.collection('gallerycategories').deleteMany({});
    await connection.collection('galleries').deleteMany({});

    // Register admin and get auth token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'category-admin@test.com',
        password: 'Test123!@#',
        name: 'Category Test Admin',
      });

    authToken = registerResponse.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup database
    await connection.collection('gallerycategories').deleteMany({});
    await connection.collection('galleries').deleteMany({});
    await connection.collection('admins').deleteMany({});
    await app.close();
  });

  beforeEach(async () => {
    // Clear categories before each test
    await connection.collection('gallerycategories').deleteMany({});
  });

  describe('POST /gallery-categories', () => {
    it('should create a new category', async () => {
      const createDto = {
        name: 'Test Category',
        description: 'Test description',
        sortIndex: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test description',
        sortIndex: 1,
        isActive: true,
      });
      expect(response.body._id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('should auto-generate slug from name', async () => {
      const response = await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Nail Art & Design' })
        .expect(201);

      expect(response.body.slug).toBe('nail-art-design');
    });

    it('should reject duplicate name (case-insensitive)', async () => {
      await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Extensions' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'EXTENSIONS' })
        .expect(409);
    });

    it('should reject duplicate slug (case-insensitive)', async () => {
      await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Nail Art', slug: 'nail-art' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Nail Art 2', slug: 'NAIL-ART' })
        .expect(409);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/gallery-categories')
        .send({ name: 'Test' })
        .expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should reject empty name', async () => {
      await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' })
        .expect(400);
    });
  });

  describe('GET /gallery-categories', () => {
    beforeEach(async () => {
      // Create test categories
      await Promise.all([
        request(app.getHttpServer())
          .post('/gallery-categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Cat 1', sortIndex: 1, isActive: true }),
        request(app.getHttpServer())
          .post('/gallery-categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Cat 2', sortIndex: 2, isActive: true }),
        request(app.getHttpServer())
          .post('/gallery-categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Inactive Cat', sortIndex: 3, isActive: false }),
      ]);
    });

    it('should list categories with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/gallery-categories')
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toMatchObject({
        total: 3,
        page: 1,
        limit: 100,
        totalPages: 1,
      });
    });

    it('should filter by isActive', async () => {
      const response = await request(app.getHttpServer())
        .get('/gallery-categories?isActive=true')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((c: any) => c.isActive === true)).toBe(
        true,
      );
    });

    it('should search by name (case-insensitive)', async () => {
      const response = await request(app.getHttpServer())
        .get('/gallery-categories?search=cat 1')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Cat 1');
    });

    it('should search by slug (case-insensitive)', async () => {
      await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Nail Art' });

      const response = await request(app.getHttpServer())
        .get('/gallery-categories?search=nail-art')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].slug).toBe('nail-art');
    });

    it('should paginate results', async () => {
      const response = await request(app.getHttpServer())
        .get('/gallery-categories?page=1&limit=2')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should be public (no auth required)', async () => {
      await request(app.getHttpServer())
        .get('/gallery-categories')
        .expect(200);
    });

    it('should sort by sortIndex and createdAt', async () => {
      const response = await request(app.getHttpServer())
        .get('/gallery-categories')
        .expect(200);

      // Check that items are sorted by sortIndex
      const sortIndexes = response.body.data.map((c: any) => c.sortIndex);
      const sortedIndexes = [...sortIndexes].sort((a, b) => a - b);
      expect(sortIndexes).toEqual(sortedIndexes);
    });
  });

  describe('GET /gallery-categories/:id', () => {
    it('should get category by ID', async () => {
      const created = await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' });

      const response = await request(app.getHttpServer())
        .get(`/gallery-categories/${created.body._id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        _id: created.body._id,
        name: 'Test',
        slug: 'test',
      });
    });

    it('should return 404 for non-existent ID', async () => {
      const fakeId = new Types.ObjectId().toString();
      await request(app.getHttpServer())
        .get(`/gallery-categories/${fakeId}`)
        .expect(404);
    });

    it('should return 400 for invalid ID format', async () => {
      await request(app.getHttpServer())
        .get('/gallery-categories/invalid-id')
        .expect(400);
    });

    it('should be public (no auth required)', async () => {
      const created = await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Public Test' });

      await request(app.getHttpServer())
        .get(`/gallery-categories/${created.body._id}`)
        .expect(200);
    });
  });

  describe('GET /gallery-categories/slug/:slug', () => {
    it('should get category by slug', async () => {
      await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Nail Art' });

      const response = await request(app.getHttpServer())
        .get('/gallery-categories/slug/nail-art')
        .expect(200);

      expect(response.body.name).toBe('Nail Art');
      expect(response.body.slug).toBe('nail-art');
    });

    it('should be case-insensitive', async () => {
      await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Extensions' });

      const response = await request(app.getHttpServer())
        .get('/gallery-categories/slug/EXTENSIONS')
        .expect(200);

      expect(response.body.name).toBe('Extensions');
    });

    it('should return 404 for non-existent slug', async () => {
      await request(app.getHttpServer())
        .get('/gallery-categories/slug/non-existent')
        .expect(404);
    });

    it('should be public (no auth required)', async () => {
      await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Public Slug Test' });

      await request(app.getHttpServer())
        .get('/gallery-categories/slug/public-slug-test')
        .expect(200);
    });
  });

  describe('PATCH /gallery-categories/:id', () => {
    it('should update category', async () => {
      const created = await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Old Name' });

      const response = await request(app.getHttpServer())
        .patch(`/gallery-categories/${created.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Name' })
        .expect(200);

      expect(response.body.name).toBe('New Name');
      expect(response.body.slug).toBe('new-name');
    });

    it('should regenerate slug when name changes', async () => {
      const created = await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Original' });

      const response = await request(app.getHttpServer())
        .patch(`/gallery-categories/${created.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.slug).toBe('updated-name');
    });

    it('should update description without changing slug', async () => {
      const created = await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test', description: 'Old desc' });

      const response = await request(app.getHttpServer())
        .patch(`/gallery-categories/${created.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'New desc' })
        .expect(200);

      expect(response.body.description).toBe('New desc');
      expect(response.body.slug).toBe('test');
    });

    it('should require authentication', async () => {
      const created = await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' });

      await request(app.getHttpServer())
        .patch(`/gallery-categories/${created.body._id}`)
        .send({ name: 'Updated' })
        .expect(401);
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = new Types.ObjectId().toString();
      await request(app.getHttpServer())
        .patch(`/gallery-categories/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' })
        .expect(404);
    });

    it('should reject duplicate name on update', async () => {
      await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Existing' });

      const created = await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'To Update' });

      await request(app.getHttpServer())
        .patch(`/gallery-categories/${created.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Existing' })
        .expect(409);
    });
  });

  describe('DELETE /gallery-categories/:id', () => {
    it('should delete category', async () => {
      const created = await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'To Delete' });

      await request(app.getHttpServer())
        .delete(`/gallery-categories/${created.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/gallery-categories/${created.body._id}`)
        .expect(404);
    });

    it('should prevent deleting "all" category', async () => {
      const allCategory = await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'All', slug: 'all' });

      const response = await request(app.getHttpServer())
        .delete(`/gallery-categories/${allCategory.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toContain(
        'Cannot delete the "all" category',
      );
    });

    it('should prevent deleting category with gallery references', async () => {
      // Create category
      const category = await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Referenced' });

      // Create gallery referencing this category
      await request(app.getHttpServer())
        .post('/gallery')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/image.jpg',
          title: 'Test Gallery',
          categoryId: category.body._id,
          price: '$50',
          duration: '60 min',
        });

      const response = await request(app.getHttpServer())
        .delete(`/gallery-categories/${category.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toContain(
        'gallery item(s) reference this category',
      );
    });

    it('should require authentication', async () => {
      const created = await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' });

      await request(app.getHttpServer())
        .delete(`/gallery-categories/${created.body._id}`)
        .expect(401);
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = new Types.ObjectId().toString();
      await request(app.getHttpServer())
        .delete(`/gallery-categories/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
