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

- [ ] Helmet headers present in responses
- [ ] CORS allows only configured origins
- [ ] Rate limiting blocks excessive requests
- [ ] Validation rejects invalid inputs
- [ ] Auth endpoints have stricter rate limits

---

## Next Steps

Move to [Phase 07: Storage](./phase-07-storage.md)
