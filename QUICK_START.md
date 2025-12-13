# 🚀 Quick Start Guide

Get your Nail Salon API running in 5 minutes!

## Prerequisites Check

Before starting, verify you have:
```bash
# Node.js v18+
node --version

# MongoDB installed
mongod --version

# Git (should already be initialized)
git --version
```

## Step 1: Start MongoDB

**Choose your method:**

**Option A - Homebrew (macOS):**
```bash
brew services start mongodb-community
```

**Option B - Direct Start (macOS/Linux):**
```bash
mongod --config /usr/local/etc/mongod.conf
```

**Option C - Docker:**
```bash
docker run -d -p 27017:27017 --name nail-salon-mongo mongo:latest
```

**Option D - Windows:**
```bash
net start MongoDB
```

**Verify MongoDB is running:**
```bash
mongo --eval "db.version()"
# or
mongosh --eval "db.version()"
```

## Step 2: Configure Environment

Your `.env` file already exists with development defaults. You can start immediately!

**Optional:** Update frontend URLs if different:
```bash
# Edit .env
FRONTEND_CLIENT_URL=http://localhost:5173
FRONTEND_ADMIN_URL=http://localhost:5174
```

## Step 3: Start the API

```bash
npm run start:dev
```

You should see:
```
🚀 Application running on: http://localhost:3000
```

## Step 4: Test the API

**Terminal 1 - Health Check:**
```bash
curl http://localhost:3000/health
```

**Terminal 2 - Register First Admin:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pinknail.com",
    "password": "admin123456",
    "name": "Admin User"
  }'
```

**Save the response - you'll get:**
```json
{
  "admin": {
    "id": "...",
    "email": "admin@pinknail.com",
    "name": "Admin User",
    "role": "staff"
  },
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

**Terminal 3 - Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pinknail.com",
    "password": "admin123456"
  }'
```

**Terminal 4 - Test Protected Endpoint:**
```bash
# Replace YOUR_TOKEN with the accessToken from above
curl http://localhost:3000/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ✅ You're Ready!

Your API is now running with:
- ✅ MongoDB connected
- ✅ JWT authentication working
- ✅ Admin user created
- ✅ CORS configured for your frontends

## Next Steps

1. **Connect Your Frontend:**
   - Update frontend API URLs to `http://localhost:3000`
   - Use the `accessToken` for authenticated requests

2. **Continue Implementation:**
   - See `SETUP.md` for detailed implementation guide
   - Follow `plans/251212-1917-nail-api-implementation/` for remaining phases

3. **Postman Collection (Optional):**
   - Import the API endpoints into Postman for easier testing
   - Base URL: `http://localhost:3000`

## 🐛 Troubleshooting

**MongoDB not connecting?**
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Check MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log
```

**Port 3000 already in use?**
```bash
# Change PORT in .env
PORT=3001
```

**Need help?**
See `SETUP.md` for comprehensive troubleshooting guide.
