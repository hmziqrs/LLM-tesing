# Multi-stage build for Pocket Budget Buddy
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json bun.lockb* ./
COPY packages/web/package.json ./packages/web/
COPY packages/api/package.json ./packages/api/
COPY packages/db/package.json ./packages/db/
COPY packages/auth/package.json ./packages/auth/

# Install Bun
RUN npm install -g bun

RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.bun ./.bun
COPY . .

# Build the application
RUN bun run build

# Production image, copy all the files and run the app
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install Bun in runner
RUN npm install -g bun

# Copy built application
COPY --from=builder /app/packages/web/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/dist ./api
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/dist ./db
COPY --from=builder --chown=nextjs:nodejs /app/packages/auth/dist ./auth
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.bun ./.bun
COPY --from=builder /app/package.json ./package.json

# Create production startup script
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["/start.sh"]