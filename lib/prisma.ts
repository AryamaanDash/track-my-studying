// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Prioritize the PRISMA_DATABASE_URL from your screenshot
const connectionString = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing database connection string in environment variables.");
}

const pool = new Pool({
  connectionString,
  // Prisma Postgres (the one with the triangle icon) handles SSL automatically,
  // but keeping this ensures local-to-cloud connections don't drop.
  ssl: { rejectUnauthorized: false } 
});

const adapter = new PrismaPg(pool);
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;