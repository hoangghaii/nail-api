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
# This layer is SHARED by both:
# - build stage (needs devDependencies for TypeScript compilation)
# - development stage (needs devDependencies for hot-reload)
#
# Why separate from development?
# - Caching: npm install runs ONCE and is reused by multiple stages
# - Efficiency: Changing source code doesn't trigger npm install
# - Speed: BuildKit cache persists across builds
# ==========================================
FROM base AS dependencies

# Use BuildKit cache mount for maximum speed
# Cache persists across builds, even when rebuilding from scratch
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit && \
    npm cache clean --force


# ==========================================
# BUILD LAYER - Compile TypeScript
# ==========================================
# Uses dependencies layer (not development layer)
# Why? Because it only needs to:
# 1. Copy source code
# 2. Run build (needs devDependencies from dependencies layer)
# 3. Remove source files
# ==========================================
FROM dependencies AS build

# Copy source code
COPY . .

# Build the application
RUN npm run build && \
    # Remove source files after build
    rm -rf src test


# ==========================================
# PRODUCTION DEPENDENCIES LAYER
# ==========================================
# Separate layer for production-only dependencies
# Excludes devDependencies (TypeScript, Jest, etc.)
# Results in smaller node_modules for production
# ==========================================
FROM base AS production-deps

# Install only production dependencies
ENV NODE_ENV=production

# Use BuildKit cache for faster builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --omit=dev && \
    npm cache clean --force


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
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./

# Switch to non-root user
USER nestjs

# Environment variables (can be overridden at runtime)
ENV NODE_ENV=production \
    PORT=3000

# Expose API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]


# ==========================================
# DEVELOPMENT LAYER - For local development
# ==========================================
# Uses dependencies layer (not merged with it)
# Why separate?
# - dependencies layer is SHARED with build stage
# - Changing source code doesn't trigger npm install
# - Can target this stage directly: docker build --target development
# ==========================================
FROM dependencies AS development

# Copy source code (changes here don't invalidate dependencies cache)
COPY . .

# Expose API port
EXPOSE 3000

# Start in development mode with hot-reload
CMD ["npm", "run", "start:dev"]
