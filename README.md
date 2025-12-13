# Nail Salon API

Production-ready NestJS REST API for nail salon business with MongoDB, JWT authentication, and Firebase Storage.

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
```

## 📚 Documentation

- **Setup Guide:** [SETUP.md](./SETUP.md)
- **Implementation Plan:** [plans/251212-1917-nail-api-implementation/plan.md](./plans/251212-1917-nail-api-implementation/plan.md)

## ✅ Current Status

**Phases Completed: 4/8**

- ✅ Phase 01: Foundation (Config, Security, Dependencies)
- ✅ Phase 02: Database (MongoDB + 8 Schemas)
- ✅ Phase 03: Authentication (JWT + Refresh Tokens)
- ✅ Phase 04: Core Modules (Services, Bookings, Gallery) - 56/56 tests passing
- ⏳ Phase 05: Admin Modules (Banners, Contacts, BusinessInfo)
- ⏳ Phase 06: Security (Redis Rate Limiting)
- ⏳ Phase 07: Storage (Firebase Integration)
- ⏳ Phase 08: Testing (Unit & E2E)

## 🎯 Features

### ✅ Implemented
- **JWT Authentication** with refresh token rotation
- **Argon2 Password Hashing** (OWASP 2025 recommendation)
- **MongoDB Integration** with Mongoose ODM
- **Type-Safe Configuration** with validation
- **Security Headers** (Helmet)
- **CORS** configured for React frontends
- **Global Validation Pipes**
- **Protected Routes** by default
- **Services Module** - CRUD with enum categories, pricing, pagination
- **Bookings Module** - Appointments with business hours validation (09:00-17:30)
- **Gallery Module** - Portfolio images with enum categories
- **Input Validation** - DTOs with class-validator, enum validation
- **Pagination** - All list endpoints support page/limit (max 100)

### ⏳ Coming Soon
- Admin modules (Banners, Contacts, BusinessInfo, HeroSettings)
- Firebase Storage for images
- Redis rate limiting
- Comprehensive E2E testing

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
POST   /services           # Create service
PATCH  /services/:id       # Update service
DELETE /services/:id       # Delete service

# Bookings (admin only)
GET    /bookings           # List all bookings
GET    /bookings/:id       # Get booking details
PATCH  /bookings/:id/status # Update booking status

# Gallery (admin CRUD)
POST   /gallery            # Upload gallery image
DELETE /gallery/:id        # Delete gallery image
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
- **Storage:** Firebase Storage (planned)
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
