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
RUN --mount=type=cache,target=/root/.npm \
  npm ci --ignore-scripts && \
  npm cache clean --force


# ==========================================
# DEVELOPMENT LAYER - For local development
# ==========================================
FROM dependencies AS development

# Copy source code (changes here don't invalidate dependencies cache)
COPY . .

# Expose API port
EXPOSE 3000

# Start in development mode with hot-reload
CMD ["npm", "run", "start:dev"]


# ==========================================
# BUILD LAYER - Compile TypeScript
# ==========================================
FROM dependencies AS builder

# Copy source code
COPY . .

# Build the application
RUN npm run build && \
  npm prune --production && \
  npm cache clean --force && \
  rm -rf \
  src \
  node_modules \
  .git \
  .github \
  tests \
  *.md \
  .prettierrc* \
  .eslintrc* \
  tsconfig.json \
  vite.config.ts


# ==========================================
# PRODUCTION DEPENDENCIES LAYER
# ==========================================
FROM base AS production-deps

# Install only production dependencies
ENV NODE_ENV=production

# Use BuildKit cache for faster builds
RUN --mount=type=cache,target=/root/.npm \
  npm ci --ignore-scripts --omit=dev && \
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
