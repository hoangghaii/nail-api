# 🐛 Troubleshooting Guide

Common issues and solutions for Nail Salon API.

---

## MongoDB Connection Issues

### Error: `MongooseError: connect ECONNREFUSED 127.0.0.1:27017`

**Cause:** MongoDB is not running

**Solution:**
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Windows
net start MongoDB

# Docker
docker start nail-salon-mongo
# or create new container
docker run -d -p 27017:27017 --name nail-salon-mongo mongo:latest

# Verify MongoDB is running
mongo --eval "db.version()"
# or
mongosh --eval "db.version()"
```

### Error: `MongoServerError: Authentication failed`

**Cause:** MongoDB requires authentication but credentials not provided

**Solution:** Update `.env`:
```env
MONGODB_URI=mongodb://username:password@localhost:27017/nail-salon?authSource=admin
```

---

## JWT Configuration Issues

### Error: `JWT secrets not configured`

**Cause:** Missing or undefined JWT secrets in environment

**Solution:** Ensure `.env` has strong secrets (min 64 characters):
```env
JWT_ACCESS_SECRET=your-strong-secret-min-64-chars-long-abc123def456ghi789jkl012
JWT_REFRESH_SECRET=another-strong-secret-min-64-chars-long-xyz987wvu654tsr321qpo098
```

**Generate secure secrets:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL
openssl rand -base64 64

# Python
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

---

## CORS Issues

### Error: `Access to fetch at 'http://localhost:3000' has been blocked by CORS`

**Cause:** Frontend URL not whitelisted in CORS configuration

**Solution:** Update `.env` with your frontend URLs:
```env
FRONTEND_CLIENT_URL=http://localhost:5173
FRONTEND_ADMIN_URL=http://localhost:5174
```

**For production:**
```env
FRONTEND_CLIENT_URL=https://yourdomain.com
FRONTEND_ADMIN_URL=https://admin.yourdomain.com
```

---

## Port Conflicts

### Error: `listen EADDRINUSE: address already in use :::3000`

**Cause:** Another process is using port 3000

**Solution 1 - Change port:**
```env
# Edit .env
PORT=3001
```

**Solution 2 - Kill existing process:**
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Authentication Issues

### Error: `Invalid credentials` when logging in

**Possible causes:**
1. Wrong email or password
2. Admin account doesn't exist
3. Admin account is deactivated

**Solution:**
```bash
# Register new admin
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123","name":"Admin"}'

# Check MongoDB for admin
mongosh nail-salon --eval "db.admins.find().pretty()"
```

### Error: `Invalid token` or `Access denied`

**Possible causes:**
1. Token expired (access token = 15 minutes)
2. Token malformed
3. JWT secret changed

**Solution:**
```bash
# Login again to get fresh token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Or refresh token
curl -X POST http://localhost:3000/auth/refresh \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
```

---

## TypeScript Compilation Issues

### Error: `Cannot find module` or `Module not found`

**Cause:** Missing dependencies or incorrect imports

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check TypeScript compilation
npx tsc --noEmit
```

### Error: Type errors in code

**Solution:**
```bash
# Check all type errors
npx tsc --noEmit

# If using VSCode, restart TS server
Cmd+Shift+P > "TypeScript: Restart TS Server"
```

---

## Environment Variable Issues

### Error: Environment validation failed

**Cause:** Missing required environment variables

**Solution:** Check `.env` has all required fields:
```env
# Required
MONGODB_URI=mongodb://localhost:27017/nail-salon
JWT_ACCESS_SECRET=<64-char-secret>
JWT_REFRESH_SECRET=<64-char-secret>
FRONTEND_CLIENT_URL=http://localhost:5173
FRONTEND_ADMIN_URL=http://localhost:5174
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-key
FIREBASE_CLIENT_EMAIL=your-email
FIREBASE_STORAGE_BUCKET=your-bucket

# Optional (can use defaults)
PORT=3000
MONGODB_MAX_POOL_SIZE=10
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Deployment Issues

### API not starting in production

**Check logs:**
```bash
npm run start:prod 2>&1 | tee logs/production.log
```

**Common issues:**
1. Missing `.env` file in production
2. MongoDB not accessible from production server
3. Firewall blocking connections

**Solution:**
```bash
# Verify environment
NODE_ENV=production node -e "console.log(process.env)"

# Test MongoDB connection
mongosh YOUR_PRODUCTION_MONGODB_URI

# Check firewall
telnet YOUR_MONGODB_HOST 27017
```

---

## Performance Issues

### API responding slowly

**Diagnose:**
```bash
# Check MongoDB query performance
mongosh nail-salon --eval "db.admins.find().explain('executionStats')"

# Monitor API logs
npm run start:dev  # Check console for slow queries
```

**Solutions:**
1. Add missing indexes (already added in schemas)
2. Optimize queries (use projection)
3. Enable caching with Redis (Phase 06)

---

## Need More Help?

1. **Check documentation:**
   - [SETUP.md](../SETUP.md)
   - [Implementation Plan](../plans/251212-1917-nail-api-implementation/plan.md)

2. **Review logs:**
   - API console output
   - MongoDB logs: `/usr/local/var/log/mongodb/mongo.log`

3. **Verify configuration:**
   - `.env` file complete
   - MongoDB running
   - All dependencies installed

4. **Test with curl:**
   - Start with `/health` endpoint
   - Test auth endpoints
   - Check Bearer token format
