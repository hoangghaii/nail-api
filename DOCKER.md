# Docker Deployment Guide

This guide covers Docker deployment for the Nail Salon API using Docker and Docker Compose.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development](#development)
- [Production](#production)
- [Docker Commands](#docker-commands)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Nail API uses a multi-stage Dockerfile optimized for:
- **Small image size** (~360MB production image)
- **Security** (non-root user, minimal Alpine base)
- **Performance** (layer caching, multi-stage builds)
- **Development experience** (hot-reload with volume mounts)

### Architecture

```
┌─────────────────┐
│   Development   │ → npm run start:dev (hot-reload)
│    (node:25)    │   + MongoDB + Redis
└─────────────────┘

┌─────────────────┐
│   Production    │ → node dist/main.js
│  (node:25-alpine)│   + Optimized layers
└─────────────────┘
```

---

## Prerequisites

- **Docker Desktop** 4.0+ ([Install](https://www.docker.com/products/docker-desktop))
- **Docker Compose** 2.0+ (included with Docker Desktop)
- **MongoDB Atlas** account (for production) or local MongoDB
- **Cloudinary** account for image storage

---

## Quick Start

### 1. Clone and Setup

```bash
cd /Users/hainguyen/Documents/nail-project/nail-api

# Copy environment variables
cp .env.example .env

# Edit .env with your MongoDB URI and secrets
nano .env
```

### 2. Start with Docker Compose (Recommended)

```bash
# Start all services (API + MongoDB + Redis)
docker compose up

# API: http://localhost:3000
# MongoDB: localhost:27017
# Redis: localhost:6379
# Swagger Docs: http://localhost:3000/api
```

### 3. Stop Services

```bash
# Stop and remove containers
docker compose down

# Stop and remove containers + volumes (data loss!)
docker compose down -v
```

---

## Development

### Using Docker Compose (Recommended)

Docker Compose automatically sets up MongoDB and Redis for you:

```bash
# Start in detached mode
docker compose up -d

# View logs
docker compose logs -f api

# Rebuild after package.json changes
docker compose up --build

# Run migrations/seeds
docker compose exec api npm run seed:categories
docker compose exec api npm run migrate:categories

# Access container shell
docker compose exec api sh
```

### Using Dockerfile Only

If you prefer manual Docker commands:

```bash
# Build development image
docker build --target development -t nail-api:dev .

# Run with external MongoDB
docker run -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/nail-salon \
  -e JWT_ACCESS_SECRET=your-secret \
  -e JWT_REFRESH_SECRET=your-secret \
  nail-api:dev
```

### Hot Reload in Docker

The development setup mounts your source code for hot-reload:

```yaml
volumes:
  - ./src:/app/src  # Changes reflect instantly
  - ./test:/app/test
```

### Debug Mode

```bash
# Start with debug logging
docker compose exec api npm run start:debug

# Attach debugger on port 9229
```

---

## Production

### Environment Variables

Create a `.env.production` file:

```env
NODE_ENV=production
PORT=3000

# MongoDB Atlas (recommended for production)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/nail-salon?retryWrites=true&w=majority
MONGODB_MAX_POOL_SIZE=20

# Redis (managed Redis recommended)
REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT Secrets (MUST be strong random strings)
JWT_ACCESS_SECRET=<generate-64-char-secret>
JWT_REFRESH_SECRET=<generate-64-char-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS
FRONTEND_CLIENT_URL=https://yoursite.com
FRONTEND_ADMIN_URL=https://admin.yoursite.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Rate Limiting
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=100
```

### Using docker-compose.prod.yml

```bash
# Build production image
docker compose -f docker-compose.prod.yml build

# Start production services (with .env.production)
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f api

# Stop
docker compose -f docker-compose.prod.yml down
```

### Using Dockerfile Only

```bash
# Build production image
docker build --target production -t nail-api:prod .

# Run production container
docker run -d \
  --name nail-api-prod \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  nail-api:prod

# View logs
docker logs -f nail-api-prod

# Stop
docker stop nail-api-prod
docker rm nail-api-prod
```

### Health Checks

The production image includes automatic health checks:

```bash
# Check container health
docker ps

# Should show "healthy" status after 10-40 seconds
```

### Resource Limits

The production docker-compose.yml includes resource limits:

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

---

## Docker Commands

### Image Management

```bash
# List images
docker images

# Remove image
docker rmi nail-api:dev

# Remove all unused images
docker image prune -a

# Build specific target
docker build --target production -t nail-api:prod .
docker build --target development -t nail-api:dev .
```

### Container Management

```bash
# List running containers
docker ps

# List all containers
docker ps -a

# View logs
docker logs -f <container-name>

# Execute command in container
docker exec -it <container-name> sh
docker exec -it nail-api-dev npm run seed:categories

# Stop container
docker stop <container-name>

# Remove container
docker rm <container-name>

# Remove all stopped containers
docker container prune
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect nail-project_mongodb-data

# Remove volume (data loss!)
docker volume rm nail-project_mongodb-data

# Remove all unused volumes
docker volume prune
```

### Network Management

```bash
# List networks
docker network ls

# Inspect network
docker network inspect nail-project_nail-network

# Connect container to network
docker network connect nail-project_nail-network <container-name>
```

---

## Troubleshooting

### Build Issues

**Problem**: Build fails with "Cannot find tsconfig.json"

```bash
# Ensure tsconfig.json is not excluded in .dockerignore
cat .dockerignore | grep tsconfig
# Should be commented: # tsconfig*.json
```

**Problem**: Build is slow

```bash
# Use BuildKit for faster builds
export DOCKER_BUILDKIT=1
docker build --target production -t nail-api:prod .
```

### Runtime Issues

**Problem**: Container exits immediately

```bash
# Check logs
docker compose logs api

# Common causes:
# - Missing required environment variables
# - MongoDB connection failure
# - Port already in use
```

**Problem**: Can't connect to MongoDB

```bash
# For local MongoDB on macOS/Windows
# Use: mongodb://host.docker.internal:27017/nail-salon

# Check if MongoDB is running
docker compose ps mongodb

# Verify MongoDB health
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

**Problem**: Changes not reflecting in development

```bash
# Ensure volumes are mounted correctly
docker compose config | grep volumes

# Rebuild if package.json changed
docker compose up --build
```

### Performance Issues

**Problem**: High memory usage

```bash
# Check container stats
docker stats

# Set memory limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 512M
```

**Problem**: Slow build times

```bash
# Use layer caching effectively
# Don't modify package.json frequently
# Use .dockerignore to exclude unnecessary files

# Multi-stage builds already optimize layers
```

### Database Issues

**Problem**: MongoDB data lost after restart

```bash
# Ensure volumes are persistent
docker volume ls | grep mongodb

# Named volumes persist data
volumes:
  - mongodb-data:/data/db
```

**Problem**: Can't access Mongo Express

```bash
# Start with debug profile
docker compose --profile debug up -d

# Access at http://localhost:8081
# Username: admin
# Password: admin123
```

### Network Issues

**Problem**: Containers can't communicate

```bash
# Verify all containers are on the same network
docker network inspect nail-project_nail-network

# Use service names as hostnames
# mongodb:27017 (not localhost:27017)
```

---

## Best Practices

### Development

1. **Use Docker Compose** for local development
2. **Mount volumes** for hot-reload
3. **Use debug profile** for Mongo Express when needed
4. **Don't commit .env** files

### Production

1. **Use MongoDB Atlas** instead of containerized MongoDB
2. **Use managed Redis** (AWS ElastiCache, Redis Cloud)
3. **Set resource limits** to prevent OOM
4. **Use health checks** for automatic recovery
5. **Enable logging** to external service (CloudWatch, Datadog)
6. **Use secrets management** (AWS Secrets Manager, HashiCorp Vault)
7. **Run as non-root** user (already configured)
8. **Keep images updated** regularly

### Security

1. **Never commit secrets** to Git
2. **Use environment variables** for sensitive data
3. **Keep base images updated**: `docker pull node:25-alpine`
4. **Scan images** for vulnerabilities: `docker scan nail-api:prod`
5. **Use multi-stage builds** to reduce attack surface (already configured)
6. **Run as non-root** user (already configured)

---

## Additional Resources

- [NestJS Docker Documentation](https://docs.nestjs.com/recipes/docker)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review Docker logs: `docker compose logs -f`
3. Inspect container: `docker compose exec api sh`
4. Check MongoDB connection: `docker compose exec mongodb mongosh`
