# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat openssl

FROM base AS dependencies

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM dependencies AS migrations

COPY lib/env.ts ./lib/env.ts
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
COPY scripts/require-database-url.mjs ./scripts/require-database-url.mjs

CMD ["npm", "run", "db:migrate:deploy"]

FROM base AS builder

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Prisma generation needs a syntactically valid URL, while NextAuth may load its
# configuration during compilation. Real credentials are supplied only at runtime.
ENV DATABASE_URL="postgresql://user:password@localhost:5432/build_placeholder"
ENV AUTH_SECRET="docker-build-placeholder-not-used-at-runtime"

RUN npm run build:app

FROM base AS runner

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

RUN addgroup -S -g 1001 nodejs \
  && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
