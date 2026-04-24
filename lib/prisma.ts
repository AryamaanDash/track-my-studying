import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString =
  process.env.PRISMA_DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    "Missing database connection string. Set PRISMA_DATABASE_URL, POSTGRES_PRISMA_URL, DATABASE_URL, or POSTGRES_URL."
  );
}

const useSsl = !/localhost|127\.0\.0\.1/.test(connectionString);
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pgPool = pool;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pool),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
