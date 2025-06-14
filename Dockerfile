# Base image
FROM node:18-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

# Create user
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D nextjs

# Copy node_modules
COPY --from=builder /app/node_modules ./node_modules

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js

# Create required dirs
RUN mkdir -p public/tickets public/uploads public/certificates

# Install timezone data and set timezone BEFORE switching user
RUN apk add --no-cache tzdata && cp /usr/share/zoneinfo/Asia/Jakarta /etc/localtime && echo "Asia/Jakarta" > /etc/timezone
ENV TZ=Asia/Jakarta

# Set permissions
RUN chown -R nextjs:nodejs /app \
 && chmod -R 777 /app \
 && chmod -R u+w /app/public/tickets /app/public/uploads /app/public/certificates

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
