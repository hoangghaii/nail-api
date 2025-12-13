# Research Report: Redis Integration with NestJS

**Date:** December 12, 2025
**Scope:** Rate limiting, caching strategies, cache-manager setup, connection best practices, when-to-cache decisions

---

## Executive Summary

Redis with NestJS provides enterprise-grade solutions for rate limiting (via `@nestjs/throttler` + Redis) and distributed caching (via `@nestjs/cache-manager`). Use Redis for high-throughput distributed systems; avoid for frequently-updated data, small datasets, or single-instance apps where overhead exceeds benefit.

---

## Key Findings

### 1. Cache Manager Setup (Production-Ready)

**Package Selection (2024-2025):**
- Primary: `@nestjs/cache-manager` + `ioredis` (most stable)
- Deprecated: `cache-manager-redis-store` (discontinued)
- Current: `cache-manager-redis-yet` or `cache-manager-ioredis`
- Future: Ecosystem moving toward Keyv-based cache-manager v6

**Basic Setup:**
```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-yet';

CacheModule.register({
  isGlobal: true,
  store: redisStore,
  host: 'localhost',
  port: 6379,
  ttl: 5 * 60 * 1000, // milliseconds (v5+)
  password: process.env.REDIS_PASSWORD,
});
```

**TTL Behavior:** v5+ uses milliseconds (not seconds); configure per-endpoint with `@CacheTTL(60000)`.

---

### 2. Rate Limiting with Redis

**Package:** `@nestjs/throttler` + `@nest-lab/throttler-storage-redis`

**Key Benefits:**
- Survives server restarts (persistent state)
- Distributed rate limits across multiple instances
- Uses Redis ZSET + sliding-window algorithm (ZADD, ZREMRANGEBYSCORE)
- Fast: designed for high-throughput operations

**Configuration:**
```typescript
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import * as Redis from 'ioredis';

ThrottlerModule.forRoot([
  {
    ttl: 60 * 1000,      // 60 seconds
    limit: 100,          // 100 requests
    storage: new ThrottlerStorageRedisService(
      new Redis({ host: 'localhost', port: 6379 })
    ),
  },
])
```

**Apply Globally:**
```typescript
// app.module.ts - providers
{
  provide: APP_GUARD,
  useClass: ThrottlerGuard,
}
```

---

### 3. Caching Strategies (When & What to Cache)

#### What to Cache (High ROI):
1. **API Responses** - External API calls, expensive computations
2. **Database Queries** - Slow aggregations, popular reads
3. **Session Data** - User profiles, preferences (short TTL)
4. **Hot Keys** - Frequently accessed static data

#### TTL Strategies:
- **API Responses:** 5-15 minutes (depends on freshness tolerance)
- **Session Data:** 30 minutes - 2 hours
- **Reference Data:** 1-24 hours (configure with `@CacheTTL(86400000)`)

#### Invalidation Techniques:
```typescript
// Decorator approach (automatic)
@Get(':id')
@CacheKey('user_:id')
@CacheTTL(300000)  // 5 min
getUser(@Param('id') id: string) { }

// Manual invalidation (after writes)
@Post()
async create(data) {
  const result = await this.db.create(data);
  await this.cacheManager.del('user_list');  // Invalidate list cache
  return result;
}

// Pattern-based (for categories)
async invalidatePattern() {
  const keys = await this.redis.scan(0, 'MATCH', 'user_*');
  await this.redis.del(...keys);
}

// Pub/Sub (distributed invalidation)
// Broadcast invalidation across services
this.pubClient.publish('cache:invalidate', 'user_list');
```

---

### 4. Redis Connection Best Practices

**Production Configuration:**
```typescript
import * as Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000), // Exponential backoff
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
});

redis.on('error', (err) => logger.error('Redis error:', err));
redis.on('connect', () => logger.log('Redis connected'));
redis.on('reconnecting', () => logger.warn('Reconnecting...'));

// Cleanup (OnModuleDestroy)
await redis.disconnect();
```

**Connection Pooling Notes:**
- ioredis auto-pools connections; no manual pool management needed
- Default: adequate for most apps; optimize if >10k concurrent ops
- Max pool size depends on: app concurrency, Redis server capacity, operation duration

---

### 5. When NOT to Cache (Critical Decision Points)

| Scenario | Why Not Cache |
|----------|---------------|
| Frequently updated data (counters, scoreboards) | Invalidation overhead > benefit |
| Small datasets (<100KB total) | Network latency dominates |
| Rarely accessed (cold data) | Maintenance cost exceeds savings |
| Real-time requirements | Stale data unacceptable |
| Single instance app | In-memory cache sufficient |
| Consistency-critical (financial, auth) | Risk of serving stale data |

**Red Flags:**
- Cache-aside pattern adds latency to first request (cold miss)
- Invalidation complexity increases with data interdependencies
- Memory overhead: Redis requires 4-6x memory of data size for internal structures

---

### 6. Performance Monitoring Checklist

**Metrics to Track:**
- Cache hit ratio (target: 70%+)
- Average response time (cached vs. uncached)
- Redis memory usage (set maxmemory policy: `allkeys-lru`)
- Connection pool utilization
- Network latency to Redis
- TTL effectiveness (cache staleness)

**Tools:**
- Redis CLI: `INFO stats`, `CLIENT LIST`
- NestJS logging: inject CacheManager for debug logs
- APM tools: DataDog, New Relic, Prometheus

---

## Practical Code Examples

### Example 1: Cache User Profile (API Response)
```typescript
@Get('profile/:id')
@CacheKey('user:profile:')
@CacheTTL(600000)  // 10 min
async getProfile(@Param('id') id: string) {
  return this.userService.findOne(id);
}
```

### Example 2: Manual Invalidation on Update
```typescript
@Put('profile/:id')
async updateProfile(@Param('id') id: string, @Body() dto) {
  const result = await this.userService.update(id, dto);
  await this.cacheManager.del(`user:profile:${id}`);
  return result;
}
```

### Example 3: Rate Limit by User ID
```typescript
@Post('login')
@Throttle({ default: { limit: 5, ttl: 900000 } })  // 5 attempts per 15 min
async login(@Body() dto) {
  return this.authService.login(dto);
}
```

### Example 4: Graceful Redis Failure (Fallback)
```typescript
@Injectable()
export class SafeCacheService {
  constructor(private cacheManager: CacheManager) {}

  async get<T>(key: string, fallback: () => Promise<T>): Promise<T> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (err) {
      console.warn('Cache miss, falling back:', err);
      return fallback();
    }
  }
}
```

---

## Common Pitfalls & Solutions

| Pitfall | Solution |
|---------|----------|
| Cascading cache invalidation | Use pub/sub + event-driven architecture |
| Memory bloat | Set Redis maxmemory + eviction policy |
| Thundering herd (cache miss spike) | Implement probabilistic early expiration |
| Stale session data | Use short TTL + explicit invalidation on logout |
| Connection leaks | Always call redis.disconnect() in OnModuleDestroy |

---

## Implementation Roadmap

**Phase 1 (Week 1):** Install packages, setup cache-manager + ioredis
**Phase 2 (Week 2):** Implement caching for slow API endpoints (start with 2-3 critical routes)
**Phase 3 (Week 3):** Add Redis rate limiting for auth endpoints
**Phase 4 (Week 4):** Monitor, optimize TTL values, cache hit ratios
**Phase 5 (Ongoing):** Add pub/sub for multi-instance invalidation, measure ROI

---

## Unresolved Questions

- What is your current infrastructure (single instance, load-balanced, k8s)?
- What are target cache hit ratios for each data type?
- Do you need multi-region Redis replication or single instance suffices?
- Budget for Redis infrastructure (self-hosted vs. managed Redis cloud)?

---

## Sources

**Official Documentation:**
- [NestJS Caching](https://docs.nestjs.com/techniques/caching)
- [NestJS Rate Limiting](https://github.com/nestjs/docs.nestjs.com/blob/master/content/security/rate-limiting.md)
- [NestJS Microservices - Redis](https://docs.nestjs.com/microservices/redis)
- [Redis Best Practices](https://redis.io/docs/latest/develop/clients/pools-and-muxing/)

**Implementation Guides:**
- [Integrating Redis with Cache Manager - Poespas Blog](https://blog.poespas.me/posts/2024/05/27/nestjs-integrate-redis-with-cache-manager/)
- [Ultimate Guide: NestJS Caching With Redis](https://www.tomray.dev/nestjs-caching-redis)
- [How to Use Redis with NestJS - LogRocket](https://blog.logrocket.com/add-redis-cache-nestjs-app/)
- [Implementing Redis-based Throttling - Hashnode](https://innosufiyan.hashnode.dev/implementing-redis-based-throttling-in-nestjs)
- [Rate Limiting Using Throttler - Telerik Blog](https://www.telerik.com/blogs/rate-limiting-nestjs-using-throttler)

**Advanced Topics:**
- [Redis as Custom Storage for Rate Limiter](https://dev.to/zsevic/redis-as-custom-storage-for-nestjs-rate-limiter-4o9k)
- [Building Smarter Rate Limits - Feng's Notes](https://ofeng.org/posts/nestjs-redis-bucket/)
- [Redis Caching Patterns - AWS](https://docs.aws.amazon.com/whitepapers/latest/database-caching-strategies-using-redis/caching-patterns.html)
- [Redis Anti-Patterns](https://redis.io/learn/howtos/antipatterns)

**Community Resources:**
- [Exploring Caching with NestJS and Redis - DEV Community](https://dev.to/fikkyman1/exploring-caching-with-nestjs-and-redis-56aj)
- [Rate Limiting in NestJS - Medium](https://medium.com/@Xfade/rate-limiting-using-throttler-in-nest-js-fb74b6661050)
