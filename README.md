# Track My Studying

A small Next.js study tracker with Auth.js credentials login, Prisma, PostgreSQL, and Recharts.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `AUTH_SECRET`.
3. Set `DATABASE_URL` and `PRISMA_DATABASE_URL` to your PostgreSQL connection string.
4. If your database provider exposes a direct/non-pooled URL, set `DIRECT_URL` or `PRISMA_MIGRATE_DATABASE_URL` for migrations.
5. Install dependencies with `npm install`.
6. Start the app with `npm run dev`.

## Useful scripts

- `npm run dev` starts the local Next.js dev server.
- `npm run lint` runs ESLint directly, which is the supported Next.js 16 workflow.
- `npm run typecheck` runs TypeScript checks.
- `npm run build:app` generates the Prisma client and compiles Next.js without applying migrations.
- `npm run db:migrate:deploy` applies Prisma migrations to the configured database.
- `npm run build` generates the Prisma client, applies migrations, and builds the production app.

## Vercel deployment notes

1. Import the GitHub repository into Vercel and keep the project root as the repository root.
2. Use the Next.js framework preset. Vercel should use `npm install` and `npm run build`.
3. Set `AUTH_SECRET` in Vercel Project Settings. Generate it with `openssl rand -base64 32`.
4. Add a PostgreSQL database. Vercel Postgres works directly; other providers are fine if they expose a Postgres connection string with SSL.
5. Set a runtime database URL: `PRISMA_DATABASE_URL`, `POSTGRES_PRISMA_URL`, `DATABASE_URL`, or `POSTGRES_URL`.
6. If your provider exposes a direct/non-pooled migration URL, set `PRISMA_MIGRATE_DATABASE_URL`, `DIRECT_URL`, or `POSTGRES_URL_NON_POOLING`. This is preferred for `prisma migrate deploy`.
7. Deploy. The production build runs `prisma generate`, then `prisma migrate deploy`, then `next build`, so the auth and study tables are created during deployment.

The app pins Node to `>=20.9.0`, which is required by Next.js 16. The database client initializes lazily at request time so `next build` can import server modules without opening a Postgres connection.

## Current auth scope

This project currently supports email/password authentication only. The broken passkey placeholder flow was removed so the deployed app no longer offers a provider that is not configured.
