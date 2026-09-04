# Track My Studying

A Next.js application for recording study sessions, journal entries, and study
progress. PostgreSQL stores application and authentication data, and Prisma
manages the database schema.

## Fully containerized setup

Docker Compose can run the complete application without installing Node.js or
PostgreSQL on your computer. The stack contains three services:

- `postgres` stores application and authentication data in a persistent volume.
- `migrate` applies Prisma migrations and exits successfully before the app starts.
- `app` runs the optimized Next.js production server as a non-root user.

### Prerequisites

- Docker Desktop or another Docker Engine with Docker Compose

### 1. Configure authentication

If you do not already have a `.env` file, create one from the example:

```bash
cp .env.example .env
```

Generate a secret with `openssl rand -base64 32` and use it as the
`AUTH_SECRET` value in `.env`. Compose requires this value but supplies its own
internal database URL, so it will not use a hosted database URL from `.env`.
Existing `NEXTAUTH_SECRET` and `BETTER_AUTH_SECRET` values are also supported.

### 2. Build and start the complete stack

```bash
docker compose up --build --wait
```

This builds the application image, starts PostgreSQL, applies migrations, and
waits for the app health check. Open [http://localhost:3000](http://localhost:3000).
If port 3000 is already in use, add `APP_PORT=3001` to `.env` and open port 3001
instead.

If Node.js is installed, `npm run docker:up` is an equivalent shortcut.

Check the containers or follow the application logs with:

```bash
docker compose ps
docker compose logs --follow app
```

### Stopping the stack

```bash
docker compose down
```

The equivalent npm shortcuts are `npm run docker:logs` and
`npm run docker:down`.

The PostgreSQL data remains in the named volume
`track-my-studying_postgres_data`. Running `docker compose down --volumes`
also deletes that volume and permanently removes the local records.

## Faster local development

On macOS and Windows, Next.js Fast Refresh is faster when Node.js runs directly
on the computer. This optional workflow containerizes only PostgreSQL while the
development server runs on the host.

### Prerequisites

- Node.js 22
- Docker Desktop or another Docker Engine with Docker Compose

### 1. Install dependencies

```bash
npm ci
```

### 2. Start PostgreSQL

```bash
docker compose up -d --wait postgres
```

The database is exposed only on `localhost:5432`. Its data uses the same named
volume as the fully containerized stack.

### 3. Configure the development server

Create the ignored local-Docker environment file:

```bash
cp .env.docker.example .env.docker.local
```

The included values point every supported database URL variable at the local
container. Authentication settings continue to come from the standard `.env`
files. This avoids overwriting an existing `.env` that may point at a hosted
database.

If you do not already have a standard `.env`, copy `.env.example` to `.env` and
generate an Auth.js secret using:

```bash
openssl rand -base64 32
```

The local database URL is:

```dotenv
DATABASE_URL="postgresql://track_my_studying:local_development_password@localhost:5432/track_my_studying?sslmode=disable"
```

The password is intentionally a local-development credential. Do not use it
for a public or production database.

### 4. Apply database migrations

```bash
npm run db:migrate:docker
```

This creates the tables defined by Prisma and records which migrations have
already run.

### 5. Start the development server

```bash
npm run dev:docker
```

Open [http://localhost:3000](http://localhost:3000).

These two `:docker` scripts load `.env.docker.local` and explicitly give its
values priority before Next.js or Prisma starts. The regular `npm run dev`
command is unchanged and continues to use the project's standard `.env*` files.

### Stopping PostgreSQL

```bash
docker compose down
```

This stops and removes the container but preserves its named volume. To delete
the database data too, run `docker compose down --volumes`. That second command
is destructive and cannot recover the local records afterward.

## Useful checks

```bash
npm test
npm run lint
npm run typecheck
npm run build:app
```

`npm run build:app` builds the application without trying to deploy database
migrations during the image-build step.
