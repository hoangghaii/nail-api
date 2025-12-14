# NestJS Nail Salon API Implementation Plan

**Date Created:** 2025-12-12
**Plan ID:** 251212-1917
**Status:** Ready for Implementation
**Estimated Duration:** 4-6 weeks

## Overview

Comprehensive plan to build production-ready NestJS REST API for nail salon business supporting:
- Client booking frontend (nail-client)
- Admin management dashboard (nail-admin)

## Tech Stack

- **Framework:** NestJS 11.x + TypeScript
- **Database:** MongoDB + Mongoose ODM
- **Storage:** Firebase Storage (images/media)
- **Cache/Rate Limiting:** Redis + ioredis
- **Authentication:** JWT with refresh token rotation
- **Security:** Helmet, CORS, class-validator, Argon2
- **Testing:** Jest (unit + e2e)

## Progressive Disclosure Structure

Each phase documented separately with full implementation details, architectural decisions, success criteria.

## Implementation Phases

### Phase 01: Foundation ✅ READY
**File:** [phase-01-foundation.md](./phase-01-foundation.md)
**Priority:** CRITICAL
**Status:** Not Started
**Duration:** 3-4 days

Setup project structure, dependencies, configuration management, environment setup.

**Key Deliverables:**
- Package dependencies installed
- Environment configuration (.env)
- Global configuration module
- Project structure established
- Linting/formatting configured

---

### Phase 02: Database ✅ READY
**File:** [phase-02-database.md](./phase-02-database.md)
**Priority:** CRITICAL
**Status:** Not Started
**Duration:** 4-5 days
**Dependencies:** Phase 01

MongoDB integration with Mongoose schemas for all entities.

**Key Deliverables:**
- MongoDB connection module
- Mongoose schemas (Services, Bookings, Gallery, Banners, Contacts, BusinessInfo, HeroSettings)
- Repository pattern implementation
- Database indexes
- Seed data scripts

---

### Phase 03: Authentication ✅ READY
**File:** [phase-03-authentication.md](./phase-03-authentication.md)
**Priority:** HIGH
**Status:** Not Started
**Duration:** 5-6 days
**Dependencies:** Phase 02

JWT-based admin authentication with refresh token rotation.

**Key Deliverables:**
- Auth module (login, logout, refresh)
- JWT strategy with guards
- Argon2 password hashing
- Refresh token rotation
- Auth decorators (@Public, @CurrentUser)
- Admin entity/schema

---

### Phase 04: Core Modules ✅ COMPLETE
**File:** [phase-04-core-modules.md](./phase-04-core-modules.md)
**Priority:** HIGH
**Status:** COMPLETE (2025-12-13)
**Duration:** 6-8 days
**Dependencies:** Phase 03

Public-facing CRUD APIs for services, bookings, gallery.

**Key Deliverables:**
- ✅ Services module (CRUD with categories, pricing)
- ✅ Bookings module (appointment scheduling, time slots, customer info)
- ✅ Gallery module (portfolio images with categories)
- ✅ DTOs with validation
- ✅ Query filtering, pagination
- ✅ 56/56 unit tests passing
- ✅ Code review completed with all fixes applied

---

### Phase 05: Admin Modules ✅ COMPLETE
**File:** [phase-05-admin-modules.md](./phase-05-admin-modules.md)
**Priority:** MEDIUM
**Status:** COMPLETE (2025-12-13)
**Duration:** 4-5 days
**Dependencies:** Phase 04

Admin-only endpoints for banners, contacts, business info, hero settings.

**Key Deliverables:**
- ✅ Banners module (hero section content) - 7 files, 286 LOC
- ✅ Contacts module (customer inquiries) - 7 files, 280 LOC
- ✅ BusinessInfo module (hours, contact details) - 5 files, 220 LOC
- ✅ HeroSettings module (display mode config) - 5 files, 145 LOC
- ✅ Protected with JWT guards
- ✅ 100/100 unit tests passing
- ✅ Code review: Grade A (93/100)

---

### Phase 06: Security ✅ COMPLETE
**File:** [phase-06-security.md](./phase-06-security.md)
**Priority:** HIGH
**Status:** COMPLETE (2025-12-13)
**Duration:** 3-4 days
**Dependencies:** Phase 05

Production security hardening.

**Key Deliverables:**
- ✅ Helmet.js security headers with CSP + HSTS
- ✅ CORS configuration (nail-client, nail-admin origins)
- ✅ Rate limiting (@nestjs/throttler + Redis with in-memory fallback)
- ✅ Global validation pipe
- ✅ Input sanitization
- ✅ Auth endpoint throttling (login: 5/15min, register: 3/hour)
- ✅ 100/100 unit tests passing
- ✅ Code review: Grade A- (91/100)

---

### Phase 07: Storage ✅ READY
**File:** [phase-07-storage.md](./phase-07-storage.md)
**Priority:** MEDIUM
**Status:** Not Started
**Duration:** 3-4 days
**Dependencies:** Phase 04, Phase 05

Firebase Storage integration for images (gallery, banners, services).

**Key Deliverables:**
- Firebase Admin SDK setup
- Upload service (single/multiple files)
- Image optimization/validation
- Secure URL generation
- Delete/cleanup operations
- Integration with Gallery, Services, Banners modules

---

### Phase 08: Testing ⚠️ IN PROGRESS
**File:** [phase-08-testing.md](./phase-08-testing.md)
**Priority:** MEDIUM
**Status:** IN PROGRESS (2025-12-14)
**Duration:** 5-7 days
**Dependencies:** All previous phases

Comprehensive test coverage.

**Key Deliverables:**
- ✅ E2E tests (72 tests, 5 suites) - Auth, Services, Bookings, Gallery, Health
- ✅ Unit tests (100 tests, 15 suites) - Services, Guards, DTOs
- ⚠️ Coverage: 65.09% (target: 80%)
- ❌ 15 E2E test failures (auth logout endpoint)
- ❌ Auth module: 0% unit coverage (CRITICAL GAP)
- ❌ Storage service: 21.42% coverage
- ⚠️ Memory leak in E2E teardown
- 📊 Code review: Grade B+ (87/100)

---

## Success Criteria

### Technical
- [ ] All modules pass unit + e2e tests
- [ ] TypeScript compilation errors = 0
- [ ] ESLint warnings = 0
- [ ] API response time < 200ms (95th percentile)
- [ ] Test coverage > 80%

### Functional
- [ ] Admin can authenticate, manage content
- [ ] Clients can browse services, create bookings
- [ ] Image uploads work with Firebase Storage
- [ ] Rate limiting prevents abuse
- [ ] CORS allows frontend access

### Security
- [ ] JWT tokens with 15min expiry
- [ ] Refresh tokens rotated on use
- [ ] Passwords hashed with Argon2
- [ ] All inputs validated (class-validator)
- [ ] Helmet security headers applied
- [ ] Redis rate limiting active

---

## Architecture Decisions

### Why MongoDB?
**Pros:** Schema flexibility (nail services vary), fast reads for booking queries, easy scaling horizontally
**Cons:** No ACID transactions (acceptable for this use case)

### Why JWT + Refresh Tokens?
**Pros:** Stateless API, scales horizontally, refresh rotation prevents token theft
**Cons:** Cannot revoke access tokens immediately (mitigated by short TTL)

### Why Firebase Storage?
**Pros:** Already used by admin, generous free tier, auto CDN, simple API
**Cons:** Vendor lock-in (acceptable for image hosting)

### Why Redis?
**Pros:** High-performance rate limiting, distributed cache, persistent state
**Cons:** Additional infrastructure (mitigated by minimal config needed)

---

## Risk Assessment

### High Risk
1. **Firebase Storage quotas:** Monitor usage, implement client-side compression
2. **MongoDB connection limits:** Use connection pooling, monitor active connections
3. **JWT secret exposure:** Use strong secrets, rotate quarterly, never commit to git

### Medium Risk
1. **Redis unavailability:** Implement fallback to in-memory rate limiting
2. **Image upload abuse:** Add file size limits (5MB), type validation, rate limiting on upload endpoints
3. **Booking conflicts:** Implement pessimistic locking or timestamp collision detection

### Low Risk
1. **TypeScript compilation:** Strict mode catches issues early
2. **CORS misconfiguration:** Test with actual frontend origins during development

---

## Development Workflow

1. **Read phase file** → Understand requirements, architecture decisions
2. **Implement code** → Follow file structure, naming conventions
3. **Run compile check** → `npm run build` to catch TypeScript errors
4. **Write tests** → Unit tests for services, e2e for APIs
5. **Run tests** → `npm run test` + `npm run test:e2e`
6. **Update documentation** → Keep README, API docs current
7. **Move to next phase** → Sequential progression

---

## File Structure Preview

```
src/
├── common/
│   ├── decorators/        # @Public, @CurrentUser
│   ├── guards/            # JwtGuard, ThrottleGuard
│   ├── interceptors/      # Logging, transform
│   └── pipes/             # Validation
├── config/
│   ├── app.config.ts      # App-wide config
│   ├── database.config.ts # MongoDB config
│   ├── jwt.config.ts      # JWT secrets
│   └── redis.config.ts    # Redis config
├── modules/
│   ├── auth/              # Authentication
│   ├── services/          # Nail services
│   ├── bookings/          # Appointments
│   ├── gallery/           # Portfolio images
│   ├── banners/           # Hero banners
│   ├── contacts/          # Customer inquiries
│   ├── business-info/     # Hours, contact
│   ├── hero-settings/     # Display config
│   └── storage/           # Firebase Storage
├── app.module.ts
└── main.ts
```

---

## Next Steps

1. **Review all phase files** → Understand full scope
2. **Start Phase 01** → Foundation setup
3. **Sequential execution** → Complete each phase before next
4. **Test continuously** → Don't accumulate tech debt
5. **Update plan status** → Track progress in this file

---

## Related Documentation

- [Security Research Report](../../plans/security-research/reports/251212-nestjs-production-security.md)
- [Redis Integration Report](../../plans/redis-integration/reports/251212-redis-nestjs-integration.md)
- [Code Standards](../../docs/code-standards.md)
- [System Architecture](../../docs/system-architecture.md)

---

## Notes

- File sizes MUST stay under 200 lines per code standard
- All endpoints MUST have DTOs with class-validator
- All modules MUST have unit tests
- Redis optional for development (in-memory fallback)
- Firebase Storage requires service account JSON (add to .env, .gitignore)

---

**Plan Status:** READY FOR IMPLEMENTATION
**Last Updated:** 2025-12-12
