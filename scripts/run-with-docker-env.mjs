import { spawn } from "node:child_process";
import { config } from "dotenv";

const packageScript = process.argv[2];

if (!packageScript) {
  console.error("Usage: node scripts/run-with-docker-env.mjs <package-script>");
  process.exit(1);
}

const dockerEnvironment = {};
const result = config({
  path: ".env.docker.local",
  processEnv: dockerEnvironment,
  quiet: true,
});

if (result.error) {
  console.error(
    "Missing .env.docker.local. Copy .env.docker.example to .env.docker.local first."
  );
  process.exit(1);
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const child = spawn(npmCommand, ["run", packageScript], {
  env: { ...process.env, ...dockerEnvironment },
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(`Unable to start npm: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
