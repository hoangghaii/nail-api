# Phase 01: Foundation Setup

**Phase ID:** 01
**Date:** 2025-12-12
**Priority:** CRITICAL
**Status:** Not Started
**Duration:** 3-4 days
**Dependencies:** None

---

## Context

Establish project foundation with proper dependencies, configuration management, environment setup, and project structure. Sets stage for all subsequent development.

**Related Documents:**
- [Main Plan](./plan.md)
- [Code Standards](../../docs/code-standards.md)

---

## Overview

Set up NestJS project with TypeScript, install required dependencies, configure environment variables, establish configuration module pattern, setup linting/formatting.

---

## Key Insights

1. **Configuration Module Pattern:** NestJS @nestjs/config provides type-safe env access, validation at startup, centralized config
2. **Dependency Selection:** Use stable, well-maintained packages; avoid deprecated libraries (e.g., cache-manager-redis-store)
3. **Environment Validation:** Fail fast on missing required env vars rather than runtime errors
4. **TypeScript Strict Mode:** Catch type errors early, improves code quality

---

## Requirements

### Functional
- Load environment variables from .env files
- Validate required environment variables at startup
- Provide type-safe configuration access across modules
- Support multiple environments (dev, test, prod)

### Non-Functional
- Zero runtime errors from missing config
- Fast startup time (<2 seconds)
- Clear error messages for misconfiguration

---

## Architecture Decisions

### Decision 1: @nestjs/config vs dotenv
**Choice:** @nestjs/config
**Pros:**
- Type-safe config access
- Built-in validation with Joi
- Namespace support for organized config
- DI integration
**Cons:**
- Slightly more boilerplate than raw dotenv
**Verdict:** Benefits outweigh minimal overhead

### Decision 2: Joi vs class-validator for env validation
**Choice:** Joi
**Pros:**
- Purpose-built for config validation
- Better error messages for env vars
- Simpler schema definition
**Cons:**
- Additional dependency (minimal impact)
**Verdict:** Standard NestJS pattern, well-documented

### Decision 3: Monolithic vs namespaced config
**Choice:** Namespaced (app.config, database.config, jwt.config, redis.config)
**Pros:**
- Clear separation of concerns
- Easier to test individual config modules
- Better IntelliSense support
**Cons:**
- More files to manage
**Verdict:** Scales better for medium/large apps

---

## Implementation Steps

### Step 1: Install Dependencies
```bash
npm install @nestjs/config joi
npm install @nestjs/mongoose mongoose
npm install @nestjs/jwt @nestjs/passport passport passport-jwt argon2
npm install @nestjs/throttler ioredis @nest-lab/throttler-storage-redis
npm install helmet class-validator class-transformer
npm install firebase-admin

npm install -D @types/passport-jwt
```

### Step 2: Create Environment Files
```bash
# .env (never commit)
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/nail-salon
MONGODB_MAX_POOL_SIZE=10

# JWT
JWT_ACCESS_SECRET=<generate-64-char-random-string>
JWT_REFRESH_SECRET=<generate-64-char-random-string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS
FRONTEND_CLIENT_URL=http://localhost:3001
FRONTEND_ADMIN_URL=http://localhost:3002

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=<from-service-account-json>
FIREBASE_CLIENT_EMAIL=<from-service-account-json>
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com

# Rate Limiting
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=100
```

```bash
# .env.example (commit this)
NODE_ENV=development
PORT=3000

MONGODB_URI=mongodb://localhost:27017/nail-salon
MONGODB_MAX_POOL_SIZE=10

JWT_ACCESS_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

FRONTEND_CLIENT_URL=http://localhost:3001
FRONTEND_ADMIN_URL=http://localhost:3002

FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_STORAGE_BUCKET=

RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=100
```

### Step 3: Create Configuration Modules

**File:** `src/config/app.config.ts`
```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  corsOrigins: [
    process.env.FRONTEND_CLIENT_URL,
    process.env.FRONTEND_ADMIN_URL,
  ].filter(Boolean),
}));
```

**File:** `src/config/database.config.ts`
```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  uri: process.env.MONGODB_URI,
  maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10) || 10,
}));
```

**File:** `src/config/jwt.config.ts`
```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
}));
```

**File:** `src/config/redis.config.ts`
```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
}));
```

**File:** `src/config/validation.schema.ts`
```typescript
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  MONGODB_URI: Joi.string().required(),
  MONGODB_MAX_POOL_SIZE: Joi.number().default(10),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  FRONTEND_CLIENT_URL: Joi.string().uri().required(),
  FRONTEND_ADMIN_URL: Joi.string().uri().required(),

  FIREBASE_PROJECT_ID: Joi.string().required(),
  FIREBASE_PRIVATE_KEY: Joi.string().required(),
  FIREBASE_CLIENT_EMAIL: Joi.string().email().required(),
  FIREBASE_STORAGE_BUCKET: Joi.string().required(),

  RATE_LIMIT_TTL: Joi.number().default(60000),
  RATE_LIMIT_MAX: Joi.number().default(100),
});
```

### Step 4: Update app.module.ts
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import { validationSchema } from './config/validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
  ],
})
export class AppModule {}
```

### Step 5: Setup Linting & Formatting

**Update eslint.config.mjs:**
```javascript
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: {
        project: 'tsconfig.json',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: eslintPluginPrettier,
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'prettier/prettier': 'error',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },
];
```

**Update .prettierrc:**
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
```

### Step 6: Update .gitignore
```
# Dependencies
node_modules/

# Environment
.env
.env.*
!.env.example

# Build
dist/
build/

# Logs
*.log
logs/

# Testing
coverage/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Firebase
firebase-service-account.json
```

### Step 7: Verify Setup
```bash
# Install dependencies
npm install

# Build project
npm run build

# Lint
npm run lint

# Start dev server
npm run start:dev
```

---

## Related Code Files

- `src/config/app.config.ts`
- `src/config/database.config.ts`
- `src/config/jwt.config.ts`
- `src/config/redis.config.ts`
- `src/config/validation.schema.ts`
- `src/app.module.ts`
- `.env.example`
- `eslint.config.mjs`
- `.prettierrc`
- `.gitignore`

---

## Todo List

- [ ] Install all NPM dependencies
- [ ] Create .env file from .env.example
- [ ] Generate strong JWT secrets (64 chars)
- [ ] Create config namespace files (app, database, jwt, redis)
- [ ] Create Joi validation schema
- [ ] Update app.module.ts with ConfigModule
- [ ] Configure ESLint with TypeScript
- [ ] Configure Prettier
- [ ] Update .gitignore
- [ ] Run `npm run build` - verify no errors
- [ ] Run `npm run lint` - verify no errors
- [ ] Start dev server - verify app boots

---

## Success Criteria

- [ ] App starts without errors with valid .env
- [ ] App throws clear error on missing required env var
- [ ] TypeScript compiles without errors
- [ ] ESLint passes with no errors
- [ ] ConfigService provides type-safe config access
- [ ] All dependencies installed successfully

---

## Risk Assessment

### High Risk
- **Missing env vars:** Joi validation fails at startup with clear messages ✅
- **Weak JWT secrets:** Joi enforces min 32 chars ✅

### Medium Risk
- **Firebase service account:** Must be obtained from Firebase console (document in README)

### Low Risk
- **Dependency conflicts:** Using latest stable versions, minimal risk

---

## Security Considerations

1. **Never commit .env:** Added to .gitignore
2. **Strong secrets:** Joi enforces minimum length
3. **Service account JSON:** Store separately, reference via env vars or mount in production
4. **CORS origins:** Validated via Joi, must be URIs

---

## Next Steps

After completing Phase 01:
1. Verify all success criteria met
2. Commit foundation code
3. Move to [Phase 02: Database](./phase-02-database.md)

---

**Phase Status:** READY FOR IMPLEMENTATION
**Estimated Effort:** 3-4 days
**Blocking Issues:** None
