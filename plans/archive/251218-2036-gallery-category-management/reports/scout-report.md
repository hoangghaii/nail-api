# Scout Report - Codebase Structure

**Date:** 2025-12-18
**Agents:** 3 parallel Explore agents
**Timeout:** 3 minutes per agent

## Executive Summary

NestJS-based nail salon API with MongoDB, Redis caching, Cloudinary storage, JWT auth. Modular architecture with 8 feature modules, comprehensive testing (72 E2E tests passing), production-ready infrastructure.

## Core Architecture

### Entry Points
- `src/main.ts` - Bootstrap, validation pipe, CORS, API prefix `/api/v1`, port 3000
- `src/app.module.ts` - Root module, imports ConfigModule, MongooseModule, Redis, 8 feature modules

### Configuration (`src/config/`)
- `app.config.ts` - Port, environment, API settings
- `database.config.ts` - MongoDB Atlas connection
- `jwt.config.ts` - Access/refresh token config
- `cloudinary.config.ts` - Image storage settings
- `redis.config.ts` - Caching configuration
- `rate-limit.config.ts` - Rate limiting rules
- `validation.schema.ts` - Env validation with Joi

## Feature Modules

### 1. Auth (`src/modules/auth/`)
**Purpose:** Admin authentication with JWT
- **Files:** controller, service, module, 2 guards, 2 strategies, 2 decorators
- **Schema:** `admin.schema.ts` - username, password (hashed), refreshToken
- **Endpoints:**
  - POST `/auth/login` - Login with credentials
  - POST `/auth/refresh` - Refresh access token
- **Guards:**
  - `access-token.guard.ts` - Protect routes requiring auth
  - `refresh-token.guard.ts` - Validate refresh tokens
- **Decorators:**
  - `@Public()` - Bypass auth guard
  - `@CurrentUser()` - Extract user from request
- **Strategy:** Passport JWT with access/refresh token validation

### 2. Services (`src/modules/services/`)
**Purpose:** Nail service catalog management
- **Schema:** name, description, price, duration, category, imageUrl, isActive
- **Endpoints:**
  - GET `/services` - List all active services
  - POST `/services` - Create service (protected)
  - PATCH `/services/:id` - Update service (protected)
  - DELETE `/services/:id` - Delete service (protected)

### 3. Bookings (`src/modules/bookings/`)
**Purpose:** Appointment scheduling system
- **Schema:** customerName, phone, email, serviceId, appointmentDate, status, notes
- **Endpoints:**
  - GET `/bookings` - List bookings (protected)
  - POST `/bookings` - Create booking (public)
  - PATCH `/bookings/:id` - Update status (protected)
  - DELETE `/bookings/:id` - Cancel booking (protected)

### 4. Gallery (`src/modules/gallery/`)
**Purpose:** Image gallery with Cloudinary integration
- **Schema:** title, imageUrl, publicId (Cloudinary), category, order
- **Endpoints:**
  - GET `/gallery` - List all images
  - POST `/gallery` - Upload image with file (protected)
  - PATCH `/gallery/:id` - Update metadata (protected)
  - DELETE `/gallery/:id` - Delete image + Cloudinary cleanup (protected)
- **Integration:** Cloudinary SDK for image upload/delete

### 5. Contacts (`src/modules/contacts/`)
**Purpose:** Customer inquiries/contact form
- **Schema:** name, email, phone, message, status, createdAt
- **Endpoints:**
  - GET `/contacts` - List messages (protected)
  - POST `/contacts` - Submit inquiry (public)
  - PATCH `/contacts/:id` - Update status (protected)
  - DELETE `/contacts/:id` - Delete message (protected)

### 6. Banners (`src/modules/banners/`)
**Purpose:** Homepage promotional banners
- **Schema:** title, subtitle, imageUrl, publicId, linkUrl, order, isActive
- **Endpoints:**
  - GET `/banners` - List active banners
  - POST `/banners` - Create banner with upload (protected)
  - PATCH `/banners/:id` - Update banner (protected)
  - DELETE `/banners/:id` - Delete banner + Cloudinary (protected)

### 7. Business Info (`src/modules/business-info/`)
**Purpose:** Salon business details (singleton pattern)
- **Schema:** name, address, phone, email, hours, socialMedia, about
- **Endpoints:**
  - GET `/business-info` - Get business info
  - PATCH `/business-info` - Update info (protected)

### 8. Hero Settings (`src/modules/hero-settings/`)
**Purpose:** Homepage hero section configuration
- **Schema:** title, subtitle, backgroundImageUrl, publicId, ctaText, ctaLink, isActive
- **Endpoints:**
  - GET `/hero-settings` - Get active hero
  - POST `/hero-settings` - Create hero config (protected)
  - PATCH `/hero-settings/:id` - Update hero (protected)
  - DELETE `/hero-settings/:id` - Delete hero (protected)

### 9. Storage (`src/modules/storage/`)
**Purpose:** Centralized file upload service
- **Service only:** `storage.service.ts` - Cloudinary upload/delete methods
- **Used by:** Gallery, Banners, Hero modules

## Key Patterns & Utilities

### Authentication Flow
1. Login generates access token (15m) + refresh token (7d)
2. Access token stored in memory, refresh token in DB (hashed)
3. `AccessTokenGuard` applied globally via `APP_GUARD`
4. Public routes marked with `@Public()` decorator
5. Protected routes get user via `@CurrentUser()` decorator

### File Upload Pattern
1. Controller receives multipart/form-data with `@UseInterceptors(FileInterceptor('file'))`
2. Service calls `StorageService.uploadFile(file)` → Cloudinary
3. Store `imageUrl` and `publicId` in MongoDB
4. On delete, call `StorageService.deleteFile(publicId)` before DB delete

### Error Handling
- Standard NestJS exception filters
- Validation pipe with `whitelist: true` to strip unknown properties
- Class-validator decorators on DTOs

## Infrastructure

### Database
- **Provider:** MongoDB Atlas
- **ODM:** Mongoose
- **Connection:** `mongodb+srv://` format with retry logic
- **Schemas:** 8 collections (Admin, Service, Booking, Gallery, Contact, Banner, BusinessInfo, HeroSettings)

### Caching
- **Provider:** Redis
- **Configuration:** Host, port, password from env
- **Usage:** Likely for session storage, rate limiting

### Storage
- **Provider:** Cloudinary
- **SDK:** cloudinary npm package
- **Features:** Upload, delete, transformation URLs
- **Max Size:** 5MB (configurable)

### Testing
- **E2E Tests:** 72 tests passing (Phase 08 complete)
- **Config:** `test/jest-e2e.json`
- **Framework:** Jest + Supertest
- **Coverage:** Key endpoints and auth flows

### Code Quality
- **Linter:** ESLint with NestJS recommended rules
- **Formatter:** Prettier
- **Commit:** Commitlint (conventional commits)
- **TypeScript:** Strict mode enabled

## Documentation Structure

```
docs/
├── code-standards.md       - Coding conventions, naming, patterns
├── codebase-summary.md     - High-level overview
├── system-architecture.md  - Technical architecture diagrams
├── project-overview-pdr.md - Product requirements
├── design-guidelines.md    - UI/UX standards
├── deployment-guide.md     - Deployment instructions
└── project-roadmap.md      - Feature roadmap
```

## Dependencies (Key)

**Framework:**
- `@nestjs/core` `@nestjs/platform-express` - NestJS framework
- `@nestjs/mongoose` - MongoDB integration
- `@nestjs/jwt` `@nestjs/passport` - Authentication
- `@nestjs/config` - Configuration management

**Database & Storage:**
- `mongoose` - MongoDB ODM
- `redis` - Caching layer
- `cloudinary` - Image CDN

**Security:**
- `bcryptjs` - Password hashing
- `passport` `passport-jwt` - Auth strategies
- `helmet` - Security headers
- `@nestjs/throttler` - Rate limiting

**Validation:**
- `class-validator` `class-transformer` - DTO validation
- `joi` - Env validation

**Testing:**
- `jest` - Test framework
- `supertest` - HTTP assertions

## File Organization

```
src/
├── main.ts                 - Application bootstrap
├── app.module.ts           - Root module
├── config/                 - Configuration files (7 files)
└── modules/                - Feature modules (8 modules)
    ├── auth/
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── auth.module.ts
    │   ├── guards/         - AccessToken, RefreshToken guards
    │   ├── strategies/     - JWT strategies
    │   ├── decorators/     - Public, CurrentUser decorators
    │   └── schemas/        - Admin schema
    ├── services/
    │   ├── *.controller.ts
    │   ├── *.service.ts
    │   ├── *.module.ts
    │   ├── dto/            - Create/Update DTOs
    │   └── schemas/        - Mongoose schemas
    └── [6 more modules following same pattern]
```

## Recent Changes (Git History)

1. **Latest:** `b490dec` - Fix: increase max size upload
2. `36c2c96` - Feat: update environment
3. `e1daacf` - Feat: migrate from Firebase Storage to Cloudinary
4. `8374905` - Feat(testing): implement phase 08 E2E testing (72 tests passing)
5. `83a282d` - Docs: add MongoDB Atlas setup guide

## API Endpoint Count

Total HTTP decorators found: **50+ endpoints** across 8 modules

## Unresolved Questions

1. **Current gallery categories** - Are categories hardcoded or dynamic? Need to check `gallery.schema.ts` for category field type (enum vs string)
2. **Frontend integration** - Is there a separate frontend repo consuming this API?
3. **Deployment status** - Is this deployed to production? What's the deployment strategy?
4. **Redis usage details** - Which modules actively use Redis cache? Only rate limiting or also sessions?
