import { Pool, type PoolClient, type PoolConfig } from "pg";
import { positiveSetting, recordPool, recordPoolAcquisition, reportError } from "./monitoring.ts";

type ConnectCallback = Parameters<Pool["connect"]>[0];

export class MonitoredPool extends Pool {
  private saturated = false;
  private lastSample = -Infinity;

  constructor(config: PoolConfig) {
    super(config);
    this.on("error", (error) => reportError(error, "database", "database"));
    // pg emits these events before updating its idle/queue collections.
    const observeSettled = () => queueMicrotask(() => this.observe());
    this.on("release", observeSettled);
    this.on("remove", observeSettled);
  }

  private observe() {
    const snapshot = {
      max: this.options.max, total: this.totalCount,
      idle: this.idleCount, waiting: this.waitingCount,
    };
    const saturated = snapshot.total >= snapshot.max && snapshot.idle === 0 && snapshot.waiting > 0;
    const now = performance.now();
    const changed = saturated !== this.saturated;
    if (changed || now - this.lastSample >= positiveSetting("POOL_LOG_INTERVAL_MS", 30000)) {
      recordPool(snapshot, saturated ? "saturated" : this.saturated ? "recovered" : "sample");
      this.lastSample = now;
    }
    this.saturated = saturated;
  }

  connect(): Promise<PoolClient>;
  connect(callback: ConnectCallback): void;
  connect(callback?: ConnectCallback): Promise<PoolClient> | void {
    const started = performance.now();
    const completed = (error?: unknown) => {
      // Compare to pg's fixed messages; never emit the message itself.
      const timeout = error instanceof Error && (
        error.message === "timeout exceeded when trying to connect" ||
        error.message === "Connection terminated due to connection timeout"
      );
      recordPoolAcquisition(performance.now() - started, error ? timeout ? "timeout" : "connection" : undefined);
      this.observe();
    };
    if (callback) {
      super.connect((error, client, release) => {
        completed(error);
        callback(error, client, release);
      });
      // Observe immediately AFTER pg has queued the request; polling or only
      // sampling after queries finish misses short-lived saturation entirely.
      this.observe();
      return;
    }
    const pending = super.connect();
    this.observe();
    return pending.then((client) => {
      completed();
      return client;
    }, (error: unknown) => {
      completed(error);
      throw error;
    });
  }
}
