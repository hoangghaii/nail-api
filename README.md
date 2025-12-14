# Nail Salon API

Production-ready NestJS REST API for nail salon business with MongoDB, JWT authentication, and Cloudinary Storage.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets

# Start MongoDB
brew services start mongodb-community  # macOS
# or
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Start API in development mode
npm run start:dev

# API runs on http://localhost:3000
# Swagger API Documentation: http://localhost:3000/api
```

## 📚 Documentation

- **API Documentation (Swagger):** http://localhost:3000/api (when running)
- **Setup Guide:** [SETUP.md](./SETUP.md)
- **Implementation Plan:** [plans/251212-1917-nail-api-implementation/plan.md](./plans/251212-1917-nail-api-implementation/plan.md)

## ✅ Current Status

**Phases Completed: 8/8** ✅ **ALL PHASES COMPLETE**

- ✅ Phase 01: Foundation (Config, Security, Dependencies)
- ✅ Phase 02: Database (MongoDB + 8 Schemas)
- ✅ Phase 03: Authentication (JWT + Refresh Tokens)
- ✅ Phase 04: Core Modules (Services, Bookings, Gallery) - 56/56 tests passing
- ✅ Phase 05: Admin Modules (Banners, Contacts, BusinessInfo, HeroSettings) - 100/100 tests passing, Grade A
- ✅ Phase 06: Security Hardening (Helmet, Rate Limiting, CORS) - 100/100 tests passing, Grade A-
- ✅ Phase 07: Cloudinary Storage Integration - 100/100 tests passing, Grade B+
- ✅ Phase 08: Testing & E2E - 72 E2E tests + 100 unit tests passing, 65% coverage, Grade B+

## 🎯 Features

### ✅ Implemented
- **Swagger/OpenAPI Documentation** - Interactive API docs at `/api`
- **JWT Authentication** with refresh token rotation
- **Argon2 Password Hashing** (OWASP 2025 recommendation)
- **MongoDB Integration** with Mongoose ODM
- **Type-Safe Configuration** with validation
- **Security Headers** (Helmet with CSP + HSTS)
- **CORS** configured for React frontends
- **Global Validation Pipes**
- **Protected Routes** by default
- **Rate Limiting** (Redis-backed with in-memory fallback)
- **Auth Endpoint Throttling** (login: 5/15min, register: 3/hour)
- **Services Module** - CRUD with enum categories, pricing, pagination
- **Bookings Module** - Appointments with business hours validation (09:00-17:30)
- **Gallery Module** - Portfolio images with enum categories
- **Input Validation** - DTOs with class-validator, enum validation
- **Pagination** - All list endpoints support page/limit (max 100)
- **Banners Module** - Hero section content (public read, admin CRUD)
- **Contacts Module** - Customer inquiries with status workflow
- **BusinessInfo Module** - Business hours, contact details (singleton)
- **HeroSettings Module** - Display mode configuration (singleton)
- **Cloudinary Storage** - Image/video uploads with automatic cleanup on delete
- **File Upload Validation** - Size (5MB images, 20MB videos) and type validation
- **Multipart Form Data** - File upload endpoints for Gallery, Services, Banners
- **Comprehensive Testing** - 72 E2E tests + 100 unit tests with 65% coverage
- **E2E Test Coverage** - Auth flow, Services CRUD, Bookings flow, Gallery CRUD, protected routes
- **Test Environment** - Dedicated test database and Cloudinary skip for CI/CD

## 🔐 API Endpoints

### Public Endpoints
```
GET  /              # Hello World
GET  /health        # Health check
POST /auth/register # Register admin
POST /auth/login    # Login
POST /auth/refresh  # Refresh tokens

# Services (public read)
GET  /services      # List services (paginated)
GET  /services/:id  # Get service details
POST /bookings      # Create booking

# Gallery (public read)
GET  /gallery       # List gallery items (paginated)

# Bookings (public create only)
POST /bookings      # Create appointment booking
```

### Protected Endpoints (Admin - Require Bearer Token)
```
POST /auth/logout   # Logout

# Services (admin CRUD)
POST   /services/upload    # Upload service with image file
POST   /services           # Create service with URL
PATCH  /services/:id       # Update service
DELETE /services/:id       # Delete service

# Bookings (admin only)
GET    /bookings           # List all bookings
GET    /bookings/:id       # Get booking details
PATCH  /bookings/:id/status # Update booking status

# Gallery (admin CRUD)
POST   /gallery/upload     # Upload gallery image file
POST   /gallery            # Create gallery item with URL
DELETE /gallery/:id        # Delete gallery image

# Banners (admin CRUD)
POST   /banners/upload/image # Upload banner image file
POST   /banners/upload/video # Upload banner video file
POST   /banners            # Create banner with URLs
GET    /banners/:id        # Get banner details
PATCH  /banners/:id        # Update banner
DELETE /banners/:id        # Delete banner

# Contacts (admin only)
GET    /contacts           # List contacts (filterable by status)
GET    /contacts/:id       # Get contact details
PATCH  /contacts/:id/status # Update contact status

# BusinessInfo (admin write, public read)
PATCH  /business-info      # Update business info

# HeroSettings (admin write, public read)
PATCH  /hero-settings      # Update hero settings
```

## 🗄️ Database Schemas

8 MongoDB schemas ready:
- **Admin** - Authentication users
- **Service** - Nail services with pricing
- **Booking** - Customer appointments
- **Gallery** - Portfolio images
- **Banner** - Hero section content
- **Contact** - Customer inquiries
- **BusinessInfo** - Hours, contact details
- **HeroSettings** - Display configuration

## 🛠️ Tech Stack

- **Framework:** NestJS 11.x + TypeScript
- **Database:** MongoDB + Mongoose ODM
- **Authentication:** JWT with refresh token rotation
- **Password Hashing:** Argon2
- **Validation:** class-validator + class-transformer
- **Security:** Helmet, CORS
- **Storage:** Cloudinary
- **Cache/Rate Limit:** Redis (planned)

## 📋 Scripts

```bash
# Development
npm run start:dev    # Start with hot-reload
npm run start:debug  # Start in debug mode

# Production
npm run build        # Compile TypeScript
npm run start:prod   # Start production server

# Testing
npm run test         # Unit tests
npm run test:e2e     # E2E tests
npm run test:cov     # Test coverage

# Code Quality
npx tsc --noEmit     # TypeScript check
npm run lint         # ESLint
npm run format       # Prettier
```

## 🌐 Frontend Integration

This API serves:
- **Client App:** `/Users/hainguyen/Documents/nail-project/nail-client`
- **Admin Dashboard:** `/Users/hainguyen/Documents/nail-project/nail-admin`

Update `.env` with your frontend URLs:
```env
FRONTEND_CLIENT_URL=http://localhost:5173
FRONTEND_ADMIN_URL=http://localhost:5174
```

## 📖 Learn More

- [NestJS Documentation](https://docs.nestjs.com)
- [MongoDB with NestJS](https://docs.nestjs.com/techniques/mongodb)
- [JWT Authentication](https://docs.nestjs.com/security/authentication)

## 📄 License

MIT
