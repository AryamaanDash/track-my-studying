import "dotenv/config";

const authSecretKeys = ["AUTH_SECRET", "NEXTAUTH_SECRET", "BETTER_AUTH_SECRET"];

const hasAuthSecret = authSecretKeys.some((key) => process.env[key]?.trim());

if (!hasAuthSecret) {
  console.error(
    [
      "Missing Auth.js secret.",
      "",
      "Set AUTH_SECRET in Vercel Project Settings for every environment you deploy to.",
      "Generate one with:",
      "  openssl rand -base64 32",
      "",
      "Accepted fallback names:",
      authSecretKeys.map((key) => `- ${key}`).join("\n"),
    ].join("\n")
  );
  process.exit(1);
}
