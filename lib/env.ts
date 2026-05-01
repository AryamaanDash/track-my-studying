type EnvSource = NodeJS.ProcessEnv;

const runtimeDatabaseUrlKeys = [
  "PRISMA_DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "DATABASE_URL",
  "POSTGRES_URL",
] as const;

const migrationDatabaseUrlKeys = [
  "PRISMA_MIGRATE_DATABASE_URL",
  "DIRECT_URL",
  "POSTGRES_URL_NON_POOLING",
  ...runtimeDatabaseUrlKeys,
] as const;

function firstPresentEnv(keys: readonly string[], source: EnvSource = process.env) {
  for (const key of keys) {
    const value = source[key]?.trim();

    if (value) {
      return value;
    }
  }

  return undefined;
}

export function getRuntimeDatabaseUrl(source?: EnvSource) {
  return firstPresentEnv(runtimeDatabaseUrlKeys, source);
}

export function getMigrationDatabaseUrl(source?: EnvSource) {
  return firstPresentEnv(migrationDatabaseUrlKeys, source);
}

export function runtimeDatabaseUrlErrorMessage() {
  return `Missing database connection string. Set one of: ${runtimeDatabaseUrlKeys.join(
    ", "
  )}.`;
}
