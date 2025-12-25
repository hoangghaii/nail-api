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
# DEPENDENCIES LAYER - Install dependencies
# ==========================================
FROM base AS dependencies

# Install all dependencies (including devDependencies for build)
RUN npm ci --prefer-offline --no-audit && \
    npm cache clean --force


# ==========================================
# BUILD LAYER - Compile TypeScript
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
FROM base AS production-deps

# Install only production dependencies
ENV NODE_ENV=production
RUN npm ci --prefer-offline --no-audit --omit=dev && \
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

# Copy production dependencies
COPY --from=production-deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application
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
FROM dependencies AS development

# Copy source code
COPY . .

# Expose API port
EXPOSE 3000

# Start in development mode with hot-reload
CMD ["npm", "run", "start:dev"]
