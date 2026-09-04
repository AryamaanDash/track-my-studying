# Track My Studying

A Next.js application for recording study sessions, journal entries, and study
progress. PostgreSQL stores application and authentication data, and Prisma
manages the database schema.

## Local development with Docker

Docker runs PostgreSQL locally while Next.js runs directly on your computer.
This keeps the database setup reproducible without slowing down Next.js Fast
Refresh.

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

The database is exposed only on `localhost:5432`. Its data is stored in the
named Docker volume `track-my-studying_postgres_data`, so stopping or replacing
the container does not delete your study data.

Check its status or read its logs with:

```bash
docker compose ps
docker compose logs postgres
```

### 3. Configure the application

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

### 5. Start the app

```bash
npm run dev:docker
```

Open [http://localhost:3000](http://localhost:3000).

These two `:docker` scripts load `.env.docker.local` and explicitly give its
values priority before Next.js or Prisma starts. The regular `npm run dev`
command is unchanged and continues to use the project's standard `.env*` files.

### Stopping the database

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
