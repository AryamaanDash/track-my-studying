# Track My Studying

A Next.js application for recording study sessions, journal entries, and study
progress. PostgreSQL stores application and authentication data; Prisma manages
the database schema.

## Local development

Requires Node.js 22 and Docker with Docker Compose supporting `--wait`.
Compose runs PostgreSQL 17; Next.js and Prisma run on your computer.

1. Install dependencies with `npm ci`.
2. If `.env` does not exist, copy `.env.example` to `.env`. Generate a secret
   with `openssl rand -base64 32` and set `AUTH_SECRET` in `.env` (or your existing
   host environment file).
3. Copy `.env.docker.example` to `.env.docker.local` if it does not exist.
4. Start the database, apply committed migrations, and start Next.js:

```bash
npm run docker:up
npm run db:generate
npm run db:migrate:docker
npm run dev:docker
```

Open [http://localhost:3000](http://localhost:3000). `docker:up` waits for the
PostgreSQL health check. The database binds only to `127.0.0.1:5432`; free that
port if another PostgreSQL instance uses it.

The `:docker` commands give `.env.docker.local` priority over existing database
variables, including provider aliases, so a hosted URL in your standard `.env*`
files does not redirect local development or migrations. Keep every URL in
`.env.docker.local` pointed at the local database. Regular `npm run dev` and
`npm run db:migrate:deploy` keep using their existing environment configuration.

## Prisma migrations

Apply committed migrations with `npm run db:migrate:docker`. After editing
`prisma/schema.prisma`, create and apply a migration against the local database:

```bash
npm run db:migrate:dev:docker -- --name describe_change
npm run db:generate
```

Commit the generated `prisma/migrations` files. Local PostgreSQL permits Prisma
to create its shadow database for `migrate dev`. Use `db:migrate:deploy` with a
direct/non-pooled connection when deploying committed migrations elsewhere.

## Containers and data

```bash
docker compose ps
npm run docker:logs
npm run docker:down
```

Stopping or recreating PostgreSQL preserves the named volume
`track-my-studying_postgres_data`. To deliberately erase **all local database
data**, run `docker compose down --volumes`. Changing PostgreSQL initialization
credentials does not update an existing volume. Back up data before a major
PostgreSQL version upgrade.

Compose passes only public local-development database credentials into
PostgreSQL. Auth secrets and hosted credentials stay on the host: no `.env`
file is mounted or passed via `env_file`, and no app image is built by Compose.
Local `.env*` files are ignored by Git and excluded from Docker builds. Never
reuse the example database password for a public or production database.

## Useful checks

```bash
npm test
npm run lint
npm run typecheck
npm run build:app
```

`build:app` builds without deploying migrations. `build` also applies migrations
using the configured database connection.
