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

## Vercel deployment

The linked Vercel project is `trackmystudying`, serving
`track-my-studying.vercel.app`. Use the Next.js framework preset and the repository
root. `package.json` pins Node.js `22.x`; Vercel's
[package.json version override](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
takes precedence over the project's dashboard selection. Use Node.js 22 for
local release checks as well.

Keep the deployment build command as `npm run build` so committed Prisma
migrations run before the production build. Use `npm run build:app` for a local
production-build check that must not apply migrations. No monitoring migration,
new service, or additional credential is required.

For each deployed environment, configure `AUTH_SECRET`, the hosted runtime
database URL and direct migration URL (for example `DATABASE_URL` and
`DIRECT_URL`), and `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` in Vercel
Project Settings. Provider URL aliases and their precedence are defined in
`lib/env.ts`; an existing alias can take priority over `DATABASE_URL` or
`DIRECT_URL`. Preview credentials must target the intended preview services.
The local database URLs in `.env.example` and `.env.docker.example` are not
deployment values. Monitoring settings below are optional server-only overrides;
their defaults work without adding them in Vercel. `RATE_LIMIT_DISABLED` does
not bypass the limiter in deployed builds.

After a future deployment, use the project's **Logs** view, select the intended
environment/deployment, and search for `operation.completed`, `server.error`,
`rate_limit.failure`, or `database.pool`. Use runtime function logs for operational
counts; build-time prerender probes can also emit completion records. Check a
normal signed-in dashboard load and study save for completion records, and a
normal failed sign-in for `outcome=rejected`. Exercise deliberate outages and
pool contention only in an isolated preview/test environment. Runtime log
retention depends on the Vercel plan; see
[Runtime Logs](https://vercel.com/docs/logs/runtime). Configure retention and
alerts in a supported drain/backend if longer history or notifications are
needed; the JSON logger itself does not create alerts.

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

## Operational monitoring

The server emits one JSON object per log line through `console.info`,
`console.warn`, or `console.error`. Monitoring starts automatically; no new
service credentials or database tables are needed. Each record includes an
ISO timestamp, event, level, fixed operation label, generated correlation ID,
and a process-instance ID. Request-supplied IDs are never trusted. The correlation
ID groups events within a monitored operation; it does not connect the proxy and
handler into a distributed trace. The instance ID groups the single shared
PostgreSQL pool's measurements within a warm application process.

| Event | Meaning and aggregation |
| --- | --- |
| `operation.completed` | One record per completed monitored invocation, with `durationMs`, `outcome`, `slow`, `slowThresholdMs`, and HTTP `status` where available. Count records for volume; count `slow=true` for slow operations; calculate latency percentiles from `durationMs`, grouped by operation. |
| `server.error` | An unexpected failure, with a fixed source/category and an approved dependency code when available. Sum `count` grouped by operation/code. Repeated reporting of the same error object is suppressed. |
| `rate_limit.rejected` | A limiter decision denied by its allowance, with `policy`, `status=429`, and `count=1`. Sum by policy. This counts limiter decisions even when a form uses an error return or Auth.js uses a redirect instead of an HTTP 429. |
| `rate_limit.failure` | `configuration`, `redis`, or `timeout` means a fail-closed decision (`status=503`). `background` means SDK background work failed and has no status; exclude it from rejection totals. Sum by policy/reason. |
| `database.pool` | Per-instance gauges: `max`, `total`, `idle`, `busy`, `waiting`, percentage `utilization`, and `state`. `saturated` means all connections are busy and requests are queued; `recovered` means that condition ended. Do not sum successive gauge samples or treat a full but unqueued pool as saturation. |
| `database.acquire` | One record for each pool acquisition attempt, including queue/connection duration and outcome; failed attempts have reason `timeout` or `connection`. A later operation error can describe the same failure at the request boundary: do not add these event families together as an error total. |
| `performance.detail` | The dashboard's existing phase timings, filtered to approved names. `dataLoadMs` covers data preparation; `responseFinishedMs` runs from dashboard entry until Next's `after` callback. |
| `auth.warning` | An Auth.js warning occurred. Raw SDK warning/debug metadata is omitted. |

Timing covers the dashboard's server work, chart/calendar APIs, Auth.js API
handlers, login/registration actions, study writes, account deletion, and weekly
reflection saves. It includes failures and returned rejections. Next's
`onRequestError` additionally reports unhandled render, route, action, and proxy
errors outside these wrappers. Redirects and Next rendering signals retain their
behavior and use `control_flow`; expected validation/authentication failures use
`rejected`, not unexpected-error reports. An Auth.js redirect can indicate a
failed operation, so prefer the explicit outcome over HTTP status alone.
An HTTP 5xx or reported unexpected error takes precedence over an earlier
expected rejection in the same operation.

Durations measure server operations, not browser latency, network transfer, or
all later React streaming. Cached responses that do not execute the handler do
not produce operation records. Killed processes cannot emit completion records;
use the hosting platform's timeout/crash telemetry alongside these logs.

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `SLOW_OPERATION_MS` | `1000` | Inclusive threshold for `slow=true`. |
| `PGPOOL_CONNECTION_TIMEOUT_MS` | `10000` | Maximum connection-establishment/pool-queue wait before pg rejects the acquisition. |
| `POOL_LOG_INTERVAL_MS` | `30000` | Minimum interval between unchanged pool-state samples. State transitions log immediately; repeated identical warnings are suppressed. |
| `SERVER_PERFORMANCE_LOGS` | unset | Set to `1` for dashboard phase details outside development. Details are always enabled in development; core operational events always emit regardless of this flag. |

Invalid, empty, zero, negative, or non-finite monitoring duration settings use
their defaults. `PGPOOL_MAX` continues to default to 5 connections per instance.
Pool measurements are triggered by acquisition/release activity, including the
moment pg enqueues a request; there is no polling interval keeping instances
alive. Capacity describes the application's local pool, not database-wide
connection limits. Acquisition duration also includes opening a connection,
so use it together with `waiting` to diagnose contention.

Logs use an allowlist rather than serializing and then redacting arbitrary
objects. Passwords/hashes, journal and reflection content, form/response bodies,
SQL and query arguments, cookies, authorization headers, tokens, connection
strings, raw URLs/query parameters, emails, IPs, user IDs, and rate-limit hashes
are excluded. Error messages, original stacks, causes, and arbitrary codes are
not emitted. Auth.js overrides every logging level; Prisma stdout query/error
logging is disabled. Monitored unexpected failures are replaced with a generic
error before reaching framework logs. The error hook also scrubs mutable errors,
including writable fields on sealed errors, before Next's Node production logger
receives them, preserving Next's numeric digest and optional internal error code.
Immutable properties on third-party errors outside the monitored operations
cannot be scrubbed in place. This hook does not sanitize tracing exporters:
Next can record an exception on a tracing span before invoking it. Do not enable
verbose dependency `DEBUG` logging in production. Host ingress/access logs and
external collectors have their own privacy and retention settings.

To operate this across deployments, send the JSON log stream to your hosting
provider's log drain or chosen log/metrics backend and retain the deployment and
environment metadata supplied by the host. The application does not store global
counters in process memory and does not provision dashboards, retention, or
alerts. Suggested queries are: error counts and error rate by operation, p95
latency and slow percentage by operation, 429/503 counts by policy/reason, and
pool saturation/acquisition timeouts by instance. Define alert windows and
thresholds in that backend after establishing a traffic baseline. Never use
correlation IDs as metric labels; their cardinality grows with request volume.

`npm test` covers secret exclusion (including nested errors and malicious
labels), safe framework logging, concurrent correlation contexts, redirect
behavior, threshold boundaries, caught persistence failures, limiter outage
counts, and the real pg-pool queue/timeout mechanics with an in-memory wire
client. These tests do not read or modify user data.
