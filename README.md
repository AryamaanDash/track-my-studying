# Track My Studying

A small Next.js study tracker with Auth.js credentials login, Prisma, PostgreSQL, and Recharts.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `AUTH_SECRET`.
3. Set `DATABASE_URL` and `PRISMA_DATABASE_URL` to your PostgreSQL connection string.
4. Install dependencies with `npm install`.
5. Start the app with `npm run dev`.

## Useful scripts

- `npm run dev` starts the local Next.js dev server.
- `npm run lint` runs ESLint directly, which is the supported Next.js 16 workflow.
- `npm run typecheck` runs TypeScript checks.
- `npm run db:migrate:deploy` applies Prisma migrations to the configured database.
- `npm run build` generates the Prisma client, applies migrations, and builds the production app.

## Vercel deployment notes

- Set `AUTH_SECRET` in Vercel Project Settings.
- Set `PRISMA_DATABASE_URL` or `POSTGRES_PRISMA_URL` in Vercel Project Settings.
- If your database provider only gives you one connection string, set `DATABASE_URL` and `PRISMA_DATABASE_URL` to that same value.
- The production build now runs `prisma migrate deploy`, so the auth and study tables are created during deployment.

## Current auth scope

This project currently supports email/password authentication only. The broken passkey placeholder flow was removed so the deployed app no longer offers a provider that is not configured.
