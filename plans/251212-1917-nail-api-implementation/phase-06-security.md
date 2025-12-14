# Phase 06: Security Hardening

**Phase ID:** 06
**Priority:** HIGH
**Duration:** 3-4 days
**Dependencies:** Phase 05

---

## Overview

Apply production security: Helmet, CORS, rate limiting, validation, input sanitization.

---

## Implementation Steps

### Step 1: Helmet Security Headers
```typescript
// src/main.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://firebasestorage.googleapis.com'],
    },
  },
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));
```

### Step 2: CORS Configuration
```typescript
// src/main.ts
app.enableCors({
  origin: [
    configService.get('FRONTEND_CLIENT_URL'),
    configService.get('FRONTEND_ADMIN_URL'),
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### Step 3: Rate Limiting with Redis
```typescript
// src/app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';

ThrottlerModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    throttlers: [{
      ttl: 60000,
      limit: 100,
    }],
    storage: new ThrottlerStorageRedisService(
      new Redis({
        host: configService.get('redis.host'),
        port: configService.get('redis.port'),
        password: configService.get('redis.password'),
      }),
    ),
  }),
  inject: [ConfigService],
}),
```

### Step 4: Global Validation Pipe
```typescript
// src/main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }),
);
```

### Step 5: Throttle Auth Endpoints
```typescript
// src/modules/auth/auth.controller.ts
@Post('login')
@Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 min
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

---

## Success Criteria

- [x] Helmet headers present in responses
- [x] CORS allows only configured origins
- [x] Rate limiting blocks excessive requests
- [x] Validation rejects invalid inputs
- [x] Auth endpoints have stricter rate limits

---

## Implementation Status

**Status:** ✅ COMPLETE
**Completed:** 2025-12-13
**Completion Date:** 2025-12-13
**Review Report:** `/plans/phase-06-security/reports/251213-code-reviewer-phase-06-security-review.md`

**Achievements:**
- ✅ Enhanced Helmet CSP with Firebase Storage support
- ✅ Redis-based rate limiting with in-memory fallback
- ✅ Stricter auth endpoint throttling (login: 5/15min, register: 3/hour)
- ✅ REDIS_ENABLED configuration added
- ✅ 100/100 unit tests passing (no regression)
- ✅ Code review: APPROVED (Grade A- 91/100)
- ✅ TypeScript compilation: SUCCESS
- ✅ Zero npm vulnerabilities

**Implementation Files:**
- `src/main.ts`: Helmet CSP + HSTS + CORS configuration
- `src/app.module.ts`: Redis-backed rate limiting with in-memory fallback
- `src/app.controller.ts`: Health check throttle exemption
- `src/modules/auth/auth.controller.ts`: Stricter auth endpoint rate limits
- `.env.example`: REDIS_ENABLED flag added

---

## Next Steps

Move to [Phase 07: Storage](./phase-07-storage.md)
