# Phase 04: Testing & Documentation

**Status**: Pending
**Progress**: 0/10 tasks
**Estimated Effort**: 3 hours
**Dependencies**: Phase 01, 02, 03 (all previous phases)

## Context

Comprehensive testing strategy covering:
- Unit tests for new GalleryCategory module
- Updated unit tests for Gallery module
- E2E tests for complete workflows
- Integration tests for category-gallery relationships
- Edge cases and error scenarios

## Overview

Test pyramid approach:
- **Unit Tests**: Fast, isolated, extensive coverage (80%+)
- **Integration Tests**: Module interactions, database operations
- **E2E Tests**: Complete user workflows, API contract validation

## Key Insights

**Test Data**: Seed test categories before each e2e test suite.

**Isolation**: Each test should be independent (create/cleanup own data).

**Coverage**: Focus on business logic, edge cases, error paths.

**Backward Compat**: Verify old API contracts still work (category enum).

## Requirements

### Functional Testing Requirements

**FT4.1**: GalleryCategory CRUD Operations
- Create category (success, duplicate name, duplicate slug)
- List categories (pagination, filtering, search)
- Get by ID (success, not found, invalid ID)
- Get by slug (success, not found, case-insensitive)
- Update category (success, slug regeneration, conflicts)
- Delete category (success, 'all' protection, reference protection)

**FT4.2**: Gallery Integration with Categories
- Create gallery with categoryId (success, validation)
- Create gallery without categoryId (auto-assign 'all')
- Query galleries by categoryId
- Query galleries by category string (backward compat)
- Update gallery categoryId
- Verify category population in responses

**FT4.3**: Edge Cases
- Invalid ObjectId formats
- Concurrent category creation with same name/slug
- Deleting category while galleries reference it
- Updating category name (slug regeneration)
- Empty/special characters in category names
- Pagination boundary conditions

**FT4.4**: Error Scenarios
- 404 Not Found responses
- 400 Bad Request for invalid input
- 409 Conflict for duplicates
- Validation errors for DTOs
- Database connection failures

### Non-Functional Testing Requirements

**NFT4.1**: Performance
- Category listing response time < 100ms
- Gallery listing with population < 200ms
- No N+1 query problems

**NFT4.2**: Data Integrity
- Transactions rollback on errors
- Cascading delete protection works
- Unique constraints enforced

**NFT4.3**: Security
- Protected routes require authentication
- Public routes accessible without auth
- Input validation prevents injection

## Architecture

### Test Structure

```
test/
├── gallery-category.e2e-spec.ts    # E2E tests for categories
├── gallery.e2e-spec.ts             # Updated with category tests
└── test-helpers/
    ├── category-factory.ts          # Test data factory
    └── auth-helper.ts               # Auth token generation
```

### E2E Test Flow

**Setup (beforeAll)**:
1. Start test app
2. Connect to test database
3. Clear collections
4. Seed test categories
5. Create test admin user
6. Generate auth tokens

**Tests (it blocks)**:
- Execute API requests
- Assert responses
- Verify database state

**Cleanup (afterAll)**:
- Clear test data
- Close database connection
- Close test app

## Implementation Steps

### Step 1: GalleryCategory E2E Tests (90 min)

**File**: `test/gallery-category.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';

describe('GalleryCategory (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    await app.init();

    connection = moduleFixture.get<Connection>('DatabaseConnection');

    // Create admin and get auth token
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@test.com',
        password: 'Password123!',
        name: 'Test Admin',
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Password123!',
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await connection.dropDatabase();
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
  });

  describe('GET /gallery-categories', () => {
    it('should list categories with pagination', async () => {
      // Create test categories
      await Promise.all([
        request(app.getHttpServer())
          .post('/gallery-categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Cat 1', sortIndex: 1 }),
        request(app.getHttpServer())
          .post('/gallery-categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Cat 2', sortIndex: 2 }),
      ]);

      const response = await request(app.getHttpServer())
        .get('/gallery-categories')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        total: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      });
    });

    it('should filter by isActive', async () => {
      await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Active', isActive: true });

      await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Inactive', isActive: false });

      const response = await request(app.getHttpServer())
        .get('/gallery-categories?isActive=true')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Active');
    });

    it('should search by name or slug', async () => {
      await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Nail Art' });

      const response = await request(app.getHttpServer())
        .get('/gallery-categories?search=nail')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Nail Art');
    });

    it('should be public (no auth required)', async () => {
      await request(app.getHttpServer())
        .get('/gallery-categories')
        .expect(200);
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
      await request(app.getHttpServer())
        .get('/gallery-categories/507f1f77bcf86cd799439011')
        .expect(404);
    });

    it('should return 400 for invalid ID format', async () => {
      await request(app.getHttpServer())
        .get('/gallery-categories/invalid-id')
        .expect(400);
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
    });

    it('should be case-insensitive', async () => {
      await request(app.getHttpServer())
        .post('/gallery-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Extensions' });

      await request(app.getHttpServer())
        .get('/gallery-categories/slug/EXTENSIONS')
        .expect(200);
    });

    it('should return 404 for non-existent slug', async () => {
      await request(app.getHttpServer())
        .get('/gallery-categories/slug/non-existent')
        .expect(404);
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

      expect(response.body.message).toContain('Cannot delete the "all" category');
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

      expect(response.body.message).toContain('gallery item(s) reference this category');
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
  });
});
```

### Step 2: Update Gallery E2E Tests (60 min)

**File**: `test/gallery.e2e-spec.ts` (add new test cases)

```typescript
describe('Gallery with Categories Integration (e2e)', () => {
  let allCategoryId: string;
  let testCategoryId: string;

  beforeEach(async () => {
    // Seed categories
    const allCat = await request(app.getHttpServer())
      .post('/gallery-categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'All', slug: 'all' });
    allCategoryId = allCat.body._id;

    const testCat = await request(app.getHttpServer())
      .post('/gallery-categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Nail Art' });
    testCategoryId = testCat.body._id;
  });

  describe('POST /gallery', () => {
    it('should create gallery with categoryId', async () => {
      const response = await request(app.getHttpServer())
        .post('/gallery')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/image.jpg',
          title: 'Test Gallery',
          categoryId: testCategoryId,
          price: '$50',
          duration: '60 min',
        })
        .expect(201);

      expect(response.body.categoryId).toBe(testCategoryId);
    });

    it('should auto-assign "all" category when categoryId not provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/gallery')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/image.jpg',
          title: 'Test Gallery',
          price: '$50',
          duration: '60 min',
        })
        .expect(201);

      expect(response.body.categoryId).toBe(allCategoryId);
    });

    it('should validate categoryId exists', async () => {
      await request(app.getHttpServer())
        .post('/gallery')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/image.jpg',
          title: 'Test Gallery',
          categoryId: '507f1f77bcf86cd799439011', // Non-existent
          price: '$50',
          duration: '60 min',
        })
        .expect(404);
    });

    it('should require price and duration', async () => {
      await request(app.getHttpServer())
        .post('/gallery')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/image.jpg',
          title: 'Test Gallery',
        })
        .expect(400);
    });
  });

  describe('GET /gallery', () => {
    it('should filter galleries by categoryId', async () => {
      // Create galleries with different categories
      await request(app.getHttpServer())
        .post('/gallery')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/1.jpg',
          title: 'Gallery 1',
          categoryId: testCategoryId,
          price: '$50',
          duration: '60 min',
        });

      await request(app.getHttpServer())
        .post('/gallery')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/2.jpg',
          title: 'Gallery 2',
          categoryId: allCategoryId,
          price: '$60',
          duration: '45 min',
        });

      const response = await request(app.getHttpServer())
        .get(`/gallery?categoryId=${testCategoryId}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Gallery 1');
    });

    it('should populate category details', async () => {
      await request(app.getHttpServer())
        .post('/gallery')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/1.jpg',
          title: 'Gallery 1',
          categoryId: testCategoryId,
          price: '$50',
          duration: '60 min',
        });

      const response = await request(app.getHttpServer())
        .get('/gallery')
        .expect(200);

      expect(response.body.data[0].categoryId).toMatchObject({
        _id: testCategoryId,
        name: 'Nail Art',
        slug: 'nail-art',
      });
    });

    it('should support deprecated category filter (backward compat)', async () => {
      // Create gallery with old category field
      await connection.collection('galleries').insertOne({
        imageUrl: 'https://example.com/1.jpg',
        title: 'Old Gallery',
        category: 'nail-art',
        price: '$50',
        duration: '60 min',
        isActive: true,
        sortIndex: 0,
      });

      const response = await request(app.getHttpServer())
        .get('/gallery?category=nail-art')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });
  });
});
```

### Step 3: Update Unit Tests (30 min)

Update existing unit tests in:
- `src/modules/gallery/gallery.service.spec.ts`
- `src/modules/gallery/gallery.controller.spec.ts`

Add mocks for GalleryCategoryService and test new functionality.

### Step 4: Test Documentation (20 min)

**File**: `test/README-TESTING.md`

```markdown
# Testing Guide

## Test Structure

- **Unit Tests**: `src/**/*.spec.ts` (90+ tests)
- **E2E Tests**: `test/*.e2e-spec.ts` (50+ tests)
- **Test Coverage**: 80%+ target

## Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov

# Watch mode (TDD)
npm run test:watch
```

## Test Database

E2E tests use separate test database configured in .env.test:

```
MONGO_URI=mongodb://localhost:27017/nail_salon_test
```

## Writing Tests

### Unit Test Pattern

```typescript
describe('Service/Controller', () => {
  let service: MyService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MyService, mockDependencies],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it('should do something', () => {
    expect(service.method()).toBe(expected);
  });
});
```

### E2E Test Pattern

```typescript
describe('Endpoint (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    // Setup app and auth
  });

  afterAll(async () => {
    await app.close();
  });

  it('should perform action', async () => {
    const response = await request(app.getHttpServer())
      .post('/endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .send(data)
      .expect(201);

    expect(response.body).toMatchObject(expected);
  });
});
```
```

## Todos

- [ ] Create gallery-category.e2e-spec.ts with 15+ test cases
- [ ] Update gallery.e2e-spec.ts with category integration tests
- [ ] Update gallery.service.spec.ts with category logic tests
- [ ] Update gallery.controller.spec.ts if needed
- [ ] Create test README documentation
- [ ] Run all tests and verify passing
- [ ] Generate coverage report (target: 80%+)
- [ ] Fix any failing tests
- [ ] Add edge case tests
- [ ] Verify backward compatibility tests pass

## Success Criteria

- ✅ All unit tests passing (100+ tests)
- ✅ All E2E tests passing (50+ tests)
- ✅ Test coverage >= 80%
- ✅ Category CRUD fully tested
- ✅ Gallery-category integration tested
- ✅ Delete protection validated
- ✅ Auto-assignment logic tested
- ✅ Backward compatibility verified
- ✅ Error scenarios covered
- ✅ Edge cases tested

## Risks

**R4.1**: Test database conflicts with development database
- **Mitigation**: Use separate database name for tests
- **Config**: .env.test with different MONGO_URI

**R4.2**: Flaky tests due to async timing
- **Mitigation**: Proper use of beforeEach/afterEach cleanup
- **Best Practice**: Each test creates and cleans own data

**R4.3**: Insufficient test coverage
- **Mitigation**: Measure coverage, add tests for uncovered paths
- **Target**: 80%+ coverage on new code

## Security Testing

- [ ] Protected routes require authentication
- [ ] Public routes accessible without auth
- [ ] Invalid ObjectIds rejected with 400
- [ ] SQL injection prevented (Mongoose ODM)
- [ ] Input validation working (DTOs)

## Performance Testing

- [ ] Category listing < 100ms
- [ ] Gallery listing with population < 200ms
- [ ] No N+1 queries (verify with MongoDB profiler)
- [ ] Pagination working correctly

## Next Steps

After Phase 04 completion:
1. Review all test results
2. Fix any failing tests
3. Achieve 80%+ coverage
4. Document test patterns
5. Ready for production deployment
