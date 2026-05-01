import "dotenv/config";

const migrationDatabaseUrlKeys = [
  "PRISMA_MIGRATE_DATABASE_URL",
  "DIRECT_URL",
  "POSTGRES_URL_NON_POOLING",
  "PRISMA_DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "DATABASE_URL",
  "POSTGRES_URL",
];

const hasDatabaseUrl = migrationDatabaseUrlKeys.some((key) =>
  process.env[key]?.trim()
);

if (!hasDatabaseUrl) {
  console.error(
    [
      "Missing database connection string for Prisma migrations.",
      "",
      "Set one of these Environment Variables in Vercel Project Settings:",
      migrationDatabaseUrlKeys.map((key) => `- ${key}`).join("\n"),
      "",
      "If you use Vercel Postgres, attach the database integration to this project.",
      "If you use another Postgres provider, set DATABASE_URL or PRISMA_DATABASE_URL with its connection string.",
    ].join("\n")
  );
  process.exit(1);
}
