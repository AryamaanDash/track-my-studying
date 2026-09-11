import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
import { MonitoredPool } from "./monitored-pool.ts";
import { positiveSetting } from "./monitoring.ts";
import { getRuntimeDatabaseUrl, runtimeDatabaseUrlErrorMessage } from "./env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: MonitoredPool;
};

function getPoolMax() {
  const parsed = Number(process.env.PGPOOL_MAX ?? 5);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 5;
}

function shouldUseSsl(connectionString: string) {
  const isLocalDatabase = /localhost|127\.0\.0\.1|\[::1\]/.test(connectionString);
  const disablesSsl = /sslmode=disable/i.test(connectionString);

  return !isLocalDatabase && !disablesSsl;
}

function getPool() {
  if (globalForPrisma.pgPool) {
    return globalForPrisma.pgPool;
  }

  const connectionString = getRuntimeDatabaseUrl();

  if (!connectionString) {
    throw new Error(runtimeDatabaseUrlErrorMessage());
  }

  const pool = new MonitoredPool({
    connectionString,
    max: getPoolMax(),
    connectionTimeoutMillis: positiveSetting("PGPOOL_CONNECTION_TIMEOUT_MS", 10000),
    ...(shouldUseSsl(connectionString)
      ? { ssl: true }
      : {}),
  });

  if (process.env.VERCEL === "1") {
    attachDatabasePool(pool);
  }

  globalForPrisma.pgPool = pool;

  return pool;
}

function getPrisma() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg(getPool()),
    // Query/error stdout logs may expose query arguments, including writing.
    log: [],
    errorFormat: "minimal",
  });

  globalForPrisma.prisma = prisma;

  return prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, property, receiver);

    return typeof value === "function" ? value.bind(client) : value;
  },
});
