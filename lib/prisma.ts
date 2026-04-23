// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// 1. Create the adapter pointing to your local SQLite file
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

// 2. Instantiate the client with the adapter
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

// 3. Prevent multiple connections during Next.js hot-reloads
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;