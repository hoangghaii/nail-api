# Nail Salon API - Setup Guide

## 🎉 Current Status

**Phases Completed: 3/8** (Foundation, Database, Authentication)

### ✅ What's Working
- **Configuration**: Type-safe environment config with validation
- **Security**: Helmet, CORS, validation pipes
- **Database**: MongoDB with 8 schemas (Services, Bookings, Gallery, Banners, Contacts, BusinessInfo, HeroSettings, Admin)
- **Authentication**: JWT with refresh token rotation, Argon2 hashing

### 🔧 Not Yet Implemented
- Services, Bookings, Gallery, Banners, Contacts, BusinessInfo, HeroSettings CRUD APIs
- Cloudinary Storage integration
- Redis rate limiting
- Unit & E2E tests

**See [QUICK_START.md](./QUICK_START.md) for 5-minute setup**

---

## 📋 Prerequisites

- **Node.js** v18+
- **MongoDB** running on port 27017 (or update `.env`)
- **Redis** (optional, for Phase 06)
- **Cloudinary** (optional, for Phase 07)

---

## 🚀 Installation

### 1. Install Dependencies
```bash
npm install  # Already done
```

### 2. Configure Environment

Update `.env` with your credentials:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/nail-salon

# JWT Secrets (CHANGE IN PRODUCTION)
JWT_ACCESS_SECRET=your-strong-64-char-secret-here
JWT_REFRESH_SECRET=your-strong-64-char-secret-here

# Frontend URLs
FRONTEND_CLIENT_URL=http://localhost:5173
FRONTEND_ADMIN_URL=http://localhost:5174

# Cloudinary (Configure in Phase 07)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Generate secure JWT secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Start MongoDB

**macOS:**
```bash
brew services start mongodb-community
```

**Windows:**
```bash
net start MongoDB
```

**Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 3a. MongoDB Atlas (Cloud Alternative)

If using MongoDB Atlas instead of local MongoDB:

**1. Create Atlas Account & Cluster:**
- Sign up at https://cloud.mongodb.com
- Create free M0 cluster (512MB storage)
- Note your cluster name (e.g., `cluster0`)

**2. Create Database User:**
- Navigate to: **Database Access** → **Add New Database User**
- **Username:** `nail_salon_api_user` (or your preference)
- **Password:** Click "Autogenerate Secure Password" (copy immediately)
- **Privileges:** "Read and write to any database"
- Click "Add User"

**3. Configure Network Access:**
- Navigate to: **Network Access** → **Add IP Address**
- **Development:** Click "Add Current IP Address"
- **Production:** Add your server IP range
- ⚠️ **Never use** `0.0.0.0/0` (allow all) in production

**4. Get Connection String:**
- Navigate to: **Clusters** → **Connect** → **Connect your application**
- Select: **Drivers** → **Node.js** → **Version 5.5 or later**
- Copy the connection string

**5. Update `.env`:**
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/nail-salon-dev?retryWrites=true&w=majority
```

**Example:**
```env
MONGODB_URI=mongodb+srv://nail_salon_api_user:YOUR_PASSWORD@cluster0.m6ia2tj.mongodb.net/nail-salon-dev?retryWrites=true&w=majority
```

**6. Verify Connection:**
```bash
npm run start:dev
# Watch for: "MongoDB connected successfully"
```

**Atlas Free Tier Limits:**
- **Storage:** 512MB
- **RAM:** Shared
- **Connections:** 500 max
- **Backups:** Manual only (auto-backup requires paid tier)

### 4. Start the API

```bash
npm run start:dev
```

Server runs on `http://localhost:3000`

---

## 📁 Project Structure

```
src/
├── config/                      # ✅ Environment configuration
├── modules/
│   ├── auth/                    # ✅ Authentication (COMPLETE)
│   ├── services/                # ⏳ TODO: Phase 04
│   ├── bookings/                # ⏳ TODO: Phase 04
│   ├── gallery/                 # ⏳ TODO: Phase 04
│   ├── banners/                 # ⏳ TODO: Phase 05
│   ├── contacts/                # ⏳ TODO: Phase 05
│   ├── business-info/           # ⏳ TODO: Phase 05
│   └── hero-settings/           # ⏳ TODO: Phase 05
├── app.module.ts
└── main.ts
```

---

## 🧪 Testing

**Health check:**
```bash
curl http://localhost:3000/health
```

**Register admin:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "name": "Admin User"
  }'
```

---

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup
- **[docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)** - API reference
- **[docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** - Common issues
- **[Implementation Plan](./plans/251212-1917-nail-api-implementation/plan.md)** - Detailed roadmap

---

## 🔐 Security Features

### ✅ Implemented
- Helmet.js security headers
- CORS for React frontends
- JWT with refresh token rotation
- Argon2 password hashing
- Global validation pipes
- Protected routes by default

### ⏳ TODO
- Redis rate limiting (Phase 06)
- Request logging
- API versioning

---

## 🗄️ Database Schemas

8 schemas ready with indexes:
- **Admin** - Auth users
- **Service** - Nail services
- **Booking** - Appointments
- **Gallery** - Portfolio
- **Banner** - Hero content
- **Contact** - Inquiries
- **BusinessInfo** - Details
- **HeroSettings** - Config

**See schemas:** `src/modules/*/schemas/*.schema.ts`

---

## 📋 Next Steps

### Phase 04: Core Modules (Services, Bookings, Gallery)
**Guide:** `plans/251212-1917-nail-api-implementation/phase-04-core-modules.md`

### Phase 05: Admin Modules
**Guide:** `plans/251212-1917-nail-api-implementation/phase-05-admin-modules.md`

### Phase 06: Security (Redis)
**Guide:** `plans/251212-1917-nail-api-implementation/phase-06-security.md`

### Phase 07: Storage (Cloudinary)
**Guide:** `plans/251212-1917-nail-api-implementation/phase-07-storage.md`

### Phase 08: Testing
**Guide:** `plans/251212-1917-nail-api-implementation/phase-08-testing.md`

---

## 🐛 Troubleshooting

**See [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** for detailed solutions.

Quick fixes:
- **MongoDB not connecting?** Check if MongoDB is running
- **JWT error?** Ensure secrets are 64+ characters
- **CORS error?** Update frontend URLs in `.env`
- **Port in use?** Change `PORT` in `.env`

---

## 🌐 Frontend Integration

Update frontend API URLs to `http://localhost:3000`

**Client:** `/Users/hainguyen/Documents/nail-project/nail-client`
**Admin:** `/Users/hainguyen/Documents/nail-project/nail-admin`

---

## 📖 Learn More

- [NestJS Docs](https://docs.nestjs.com)
- [MongoDB with NestJS](https://docs.nestjs.com/techniques/mongodb)
- [JWT Authentication](https://docs.nestjs.com/security/authentication)

---

**Happy coding! 🚀**
