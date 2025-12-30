# ==========================================
# BASE LAYER - Common base for all stages
# ==========================================
FROM node:25-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package files
COPY package*.json ./


# ==========================================
# DEPENDENCIES LAYER - Install ALL dependencies
# ==========================================
FROM base AS dependencies

# Use BuildKit cache mount for maximum speed
# Cache persists across builds, even when rebuilding from scratch
# Note: Do not use 'npm cache clean' with BuildKit cache mounts - causes ENOTEMPTY errors
RUN --mount=type=cache,target=/root/.npm \
  npm ci --ignore-scripts


# ==========================================
# DEVELOPMENT LAYER - For local development
# ==========================================
FROM dependencies AS development

# Copy source code (changes here don't invalidate dependencies cache)
COPY . .

# Expose API port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start in development mode with hot-reload
CMD ["npm", "run", "start:dev"]


# ==========================================
# BUILD LAYER - Compile TypeScript
# ==========================================
FROM dependencies AS builder

# Copy source code
COPY . .

# Note: .env files are provided at runtime via docker-compose env_file
# Build does not need .env (NestJS compiles TypeScript, doesn't process env vars)

# Build the application
RUN NODE_ENV=production npm run build && \
  npm prune --production && \
  rm -rf \
  src \
  tsconfig*.json


# ==========================================
# PRODUCTION DEPENDENCIES LAYER
# ==========================================
FROM base AS production-deps

# Use BuildKit cache for faster builds
# Note: Do not use 'npm cache clean' with BuildKit cache mounts - causes ENOTEMPTY errors
RUN --mount=type=cache,target=/root/.npm \
  npm ci --ignore-scripts --omit=dev


# ==========================================
# PRODUCTION LAYER - Final production image
# ==========================================
FROM node:25-alpine AS production

# Install dumb-init
RUN apk add --no-cache dumb-init

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nestjs -u 1001 -G nodejs

# Copy production dependencies (NO devDependencies)
COPY --from=production-deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application (compiled JavaScript)
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Switch to non-root user
USER nestjs

# Environment variables (can be overridden at runtime)
ENV NODE_ENV=production \
  PORT=3000

# Expose API port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]
