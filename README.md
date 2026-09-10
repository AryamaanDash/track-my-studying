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
   Configure the Redis REST credentials described below, or explicitly set
   `RATE_LIMIT_DISABLED=1` in your local environment to develop without Redis.
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

## Shared rate limiting

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to the REST credentials
of an Upstash Redis database before running the app. Keep the same Redis database,
`AUTH_SECRET`, and `RATE_LIMIT_PREFIX` across all instances of an environment.
The prefix defaults to `track-my-studying`; keys also include `VERCEL_ENV` (or
`NODE_ENV` outside Vercel) to separate development, preview, and production.
Use a different prefix for unrelated installations sharing Redis.

The shared implementation lives in `lib/rate-limit-core.ts`, exposed to the app
through the server-only `lib/rate-limit.ts`. All policies use Upstash's atomic
Redis-backed sliding-window counter: it weights the preceding window alongside
the current one, approximating a rolling limit with bounded storage. Counters
expire automatically. SDK clients are reused locally, but request allowances
are not stored in process memory. Analytics and the SDK's local blocking cache
are disabled.

| Policy | Key | Allowance |
| --- | --- | --- |
| Proxy: pages, API routes, and Server Action requests | Trusted client IP | 300 / minute |
| Login | Trusted client IP | 30 / 15 minutes |
| Login, additional account limit | Normalized email | 10 / 15 minutes |
| Registration | Trusted client IP | 5 / hour |
| Study create/update/delete, weekly reflections, account deletion | Authenticated user ID, one shared write budget | 30 / minute |
| Account-deletion password verification, additional limit | Authenticated user ID | 5 / 15 minutes |

Limits are checked before protected database queries/writes and password hashing
or comparison. Login checks live in the credentials provider, so the login form
and direct Auth.js callback requests share the same limits. Registration is
checked inside its Server Action. All attempts count, including unsuccessful
ones; successful login does not clear counters. General proxy and specific
operation limits are separate layers. Static Next.js assets and the favicon
are excluded from the proxy policy; API routes are included. Adjust allowances
in `rateLimitPolicies` after observing normal traffic, especially shared campus
or household IPs.

On Vercel, the limiter reads `x-vercel-forwarded-for`. When self-hosting, set
`RATE_LIMIT_IP_HEADER` only to a header your ingress **overwrites** with one
validated client IP, and prevent direct public access to the app behind that
ingress. Never forward a user-provided header unchanged. Missing/invalid IPs,
including comma-separated forwarding chains, share an `unknown` bucket instead
of bypassing limits. IPv6 addresses are canonicalized. IPs, emails, and user IDs
are HMAC-hashed with the auth secret before becoming Redis keys; no journal or
password data is sent to Redis.

The proxy returns `429` plus `Retry-After` and `Cache-Control: private, no-store`
when exhausted. Forms show retry messages; study edits, notes, and timer drafts
stay available when their action is rejected. Direct Auth.js callback requests
retain Auth.js's error/redirect protocol (`CredentialsSignin` with a
`rate_limited` or `temporarily_unavailable` code). A sliding-window retry time
is advisory: prior-window traffic can still count after the next boundary.

Missing Redis credentials, Redis errors, or timeouts **block** protected work;
the proxy returns `503`, and actions show a temporary-unavailability message.
Redis requests have a 1.5-second timeout with retries disabled, and the SDK's
default allow-on-timeout behavior is explicitly overridden. For local work
without Redis, explicitly set `RATE_LIMIT_DISABLED=1`; this opt-out is honored
only in `NODE_ENV=development`, never in production or previews.

`npm test` includes policy, IP-trust, and outage tests. To additionally exercise
the actual SDK/Lua scripts against a disposable local Redis container:

```bash
docker run --rm -d --name study-rate-limit-test redis:7-alpine
RATE_LIMIT_REDIS_CONTAINER=study-rate-limit-test npm test
docker stop study-rate-limit-test
```

The integration test uses a loopback REST bridge to the named test container;
it needs no hosted credentials and does not access application data.
