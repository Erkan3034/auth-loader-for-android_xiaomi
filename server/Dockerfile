# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Run tests and build (if applicable)
RUN npm run test
RUN npm audit --audit-level moderate

# Production stage
FROM node:18-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S xiaomi -u 1001

# Set working directory
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY --from=builder --chown=xiaomi:nodejs /app/src ./src
COPY --from=builder --chown=xiaomi:nodejs /app/migrations ./migrations
COPY --from=builder --chown=xiaomi:nodejs /app/env.example ./

# Create logs directory
RUN mkdir -p logs && chown xiaomi:nodejs logs

# Install PM2 globally
RUN npm install pm2 -g

# Copy PM2 ecosystem file
COPY --chown=xiaomi:nodejs ecosystem.config.js ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Switch to non-root user
USER xiaomi

# Start application with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
