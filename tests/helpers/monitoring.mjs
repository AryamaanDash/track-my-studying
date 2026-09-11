import { unstable_rethrow } from "next/navigation.js";
import * as monitoring from "../../lib/monitoring.ts";
import { loadIsolatedModule } from "./load-isolated-module.mjs";

export { monitoring };
export const monitored = loadIsolatedModule(new URL("../../lib/monitor-operation.ts", import.meta.url), {
  "next/navigation": { unstable_rethrow },
  "./monitoring.ts": monitoring,
});

export function captureLogs(t) {
  const records = [];
  for (const level of ["info", "warn", "error"]) {
    t.mock.method(console, level, (line) => records.push(JSON.parse(line)));
  }
  return records;
}
