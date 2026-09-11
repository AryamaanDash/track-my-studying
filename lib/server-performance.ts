import { recordPerformance, type Operation } from "./monitoring.ts";

type ServerTimings = Record<string, number>;

export function startServerTimer() {
  return process.hrtime.bigint();
}

export function getServerElapsedMs(started: bigint) {
  return Number(process.hrtime.bigint() - started) / 1_000_000;
}

export function shouldLogServerPerformance() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.SERVER_PERFORMANCE_LOGS === "1"
  );
}

export function logServerPerformance(scope: Operation, timings: ServerTimings) {
  if (!shouldLogServerPerformance()) return;

  recordPerformance(scope, timings);
}
