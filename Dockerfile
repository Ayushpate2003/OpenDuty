# Stage 1: Base
# ----------------------------------------
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# Stage 2: Deps
# ----------------------------------------
FROM base AS deps
COPY package.json package-lock.json* ./
# Install dependencies including devDependencies (needed for build)
RUN npm ci

# Stage 3: Builder
# ----------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the Next.js application
# This assumes "build:api" runs "next build"
RUN npm run build:api

# Stage 4: Runner
# ----------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Next.js telemetry disable
ENV NEXT_TELEMETRY_DISABLED=1
# Bind host to 0.0.0.0
ENV HOSTNAME="0.0.0.0"
ENV PORT=8080

# Create simple non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the necessary files for the standalone server
# COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
# mkdir .next before copying to ensure permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

# Next.js standalone output runs as a simple node server
CMD ["node", "server.js"]
