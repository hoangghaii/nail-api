# Phase 08: Testing

**Phase ID:** 08
**Priority:** MEDIUM
**Duration:** 5-7 days
**Dependencies:** All previous phases

---

## Overview

Comprehensive test coverage with unit tests (services, guards) and e2e tests (API flows).

---

## Testing Strategy

### Unit Tests
- **Services:** Business logic, validation, error handling
- **Guards:** JWT validation, public route handling
- **Pipes:** DTO validation

### E2E Tests
- **Auth flow:** Register, login, refresh, logout
- **Services CRUD:** Create, read, update, delete
- **Bookings flow:** Create booking, time slot validation
- **Protected routes:** Verify JWT guards work

---

## Example Unit Test

```typescript
// src/modules/services/services.service.spec.ts
describe('ServicesService', () => {
  let service: ServicesService;
  let model: Model<Service>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getModelToken(Service.name),
          useValue: {
            find: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    model = module.get<Model<Service>>(getModelToken(Service.name));
  });

  it('should return all services', async () => {
    const mockServices = [{ name: 'Manicure', price: 25 }];
    jest.spyOn(model, 'find').mockReturnValue({
      exec: jest.fn().resolvedValue(mockServices),
    } as any);

    const result = await service.findAll();
    expect(result).toEqual(mockServices);
  });
});
```

---

## Example E2E Test

```typescript
// test/auth.e2e-spec.ts
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        accessToken = res.body.accessToken;
      });
  });

  it('/services (POST) should be protected', () => {
    return request(app.getHttpServer())
      .post('/services')
      .send({ name: 'Test Service', price: 30 })
      .expect(401);
  });
});
```

---

## Success Criteria

- [ ] Unit test coverage > 80%
- [ ] All e2e tests pass
- [ ] Protected routes tested with/without JWT
- [ ] Error scenarios covered
- [ ] CI-ready test configuration

---

## Final Steps

After Phase 08 completion:
1. Run full test suite
2. Fix any failing tests
3. Review test coverage report
4. Document API endpoints
5. Update README with setup instructions
6. Ready for deployment

---

**Plan Complete:** All 8 phases documented
**Total Duration:** 4-6 weeks
**Status:** READY FOR IMPLEMENTATION
