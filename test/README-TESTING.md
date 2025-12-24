# Testing Guide

## Test Structure

- **Unit Tests**: `src/**/*.spec.ts` (137 tests)
- **E2E Tests**: `test/*.e2e-spec.ts` (70+ tests)
- **Test Coverage**: 80%+ target

## Running Tests

```bash
# All unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov

# Watch mode (TDD)
npm run test:watch

# Specific test file
npm test -- gallery.service.spec.ts
npm run test:e2e -- gallery-category.e2e-spec.ts
```

## Test Database

E2E tests use the same database configured in .env but with separate collections that are cleaned before/after tests.

**Important**: E2E tests clean up their data in `beforeAll`/`afterAll` hooks.

## Test Files

### Unit Tests

- `src/modules/gallery-category/gallery-category.service.spec.ts` - Category service tests (35 tests)
- `src/modules/gallery-category/gallery-category.controller.spec.ts` - Category controller tests
- `src/modules/gallery/gallery.service.spec.ts` - Gallery service tests (14 tests)
- `src/modules/gallery/gallery.controller.spec.ts` - Gallery controller tests
- Other module tests (services, bookings, contacts, banners, etc.)

### E2E Tests

- `test/gallery-category.e2e-spec.ts` - Category CRUD operations (35+ tests)
- `test/gallery.e2e-spec.ts` - Gallery operations with category integration (25+ tests)
- `test/services.e2e-spec.ts` - Services endpoints
- `test/bookings.e2e-spec.ts` - Bookings endpoints
- `test/auth.e2e-spec.ts` - Authentication endpoints

## Writing Tests

### Unit Test Pattern

```typescript
describe('ServiceName', () => {
  let service: MyService;
  let mockDependency: jest.Mocked<Dependency>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MyService,
        {
          provide: DependencyService,
          useValue: mockDependency,
        },
      ],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it('should do something', async () => {
    mockDependency.method.mockResolvedValue(result);
    const output = await service.method(input);
    expect(output).toBe(expected);
  });
});
```

### E2E Test Pattern

```typescript
describe('Endpoint (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let connection: Connection;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());

    // Setup auth
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test@test.com', password: 'Test123!@#', name: 'Test' });
    authToken = registerResponse.body.accessToken;
  });

  afterAll(async () => {
    await connection.collection('collectionname').deleteMany({});
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

## Gallery Category Tests

### Unit Tests Coverage

**GalleryCategoryService** (35 tests):
- CRUD operations (create, findAll, findOne, findBySlug, update, remove)
- Slug generation and collision handling
- Duplicate name/slug validation
- Delete protection for 'all' category
- Cascading delete protection
- Pagination and filtering
- Search functionality

**GalleryCategoryController**:
- Request/response mapping
- DTO validation
- Error handling

### E2E Tests Coverage

**Category Endpoints** (35+ tests):
- POST /gallery-categories (creation, validation, auth, duplicates)
- GET /gallery-categories (pagination, filtering, search, public access)
- GET /gallery-categories/:id (retrieval, 404, 400, public access)
- GET /gallery-categories/slug/:slug (case-insensitive, 404, public access)
- PATCH /gallery-categories/:id (update, slug regeneration, auth, conflicts)
- DELETE /gallery-categories/:id (deletion, 'all' protection, reference protection, auth)

**Gallery Integration** (10+ tests):
- Create with categoryId
- Auto-assign 'all' category
- CategoryId validation
- Filter by categoryId
- Populate category details
- Required price/duration fields

## Migration Scripts

### Seed Categories

```bash
npm run seed:categories
```

Creates 6 initial categories (all, extensions, manicure, nail-art, pedicure, seasonal).

### Migrate Galleries

```bash
npm run migrate:categories
```

Migrates existing galleries to reference categories via ObjectId.

## Test Coverage Goals

- **Unit Tests**: 80%+ statement coverage
- **E2E Tests**: All critical user flows covered
- **Edge Cases**: Error scenarios, boundary conditions
- **Backward Compatibility**: Legacy API contracts validated

## Current Test Status

**Unit Tests**: ✅ 137 passing
- Gallery module: 28 tests
- GalleryCategory module: 39 tests
- Other modules: 70 tests

**E2E Tests**: ✅ 70+ tests expected
- GalleryCategory: 35+ tests
- Gallery: 25+ tests
- Other endpoints: 10+ tests

**Coverage**: Target 80%+

## Common Issues

### MongoDB Connection Issues

If tests fail with connection errors:
1. Ensure MongoDB is running
2. Check MONGO_URI in .env
3. Verify network connectivity

### Test Isolation

Each test should:
- Create its own test data
- Clean up after itself
- Not depend on other tests
- Use unique identifiers

### Authentication

E2E tests require:
- Valid auth token from /auth/register
- Token included in Authorization header
- Admin user created in beforeAll

## CI/CD Integration

Tests run automatically in CI/CD pipeline:
1. Install dependencies
2. Start MongoDB (if needed)
3. Run unit tests
4. Run E2E tests
5. Generate coverage report
6. Fail build if tests fail or coverage < 80%

## Next Steps

After testing phase:
1. Review coverage reports
2. Add tests for uncovered code paths
3. Document edge cases
4. Update test data factories
5. Ready for production deployment
