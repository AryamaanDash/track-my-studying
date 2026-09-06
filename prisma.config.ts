import "dotenv/config";
import { defineConfig } from "prisma/config";
import { getMigrationDatabaseUrl, prismaGeneratePlaceholderUrl } from "./lib/env";

const databaseUrl = getMigrationDatabaseUrl();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl ?? prismaGeneratePlaceholderUrl,
  },
});
