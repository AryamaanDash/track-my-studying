import { unstable_rethrow } from "next/navigation";
import {
  isExpectedError, markOutcome, recordOperation, reportError,
  safeOperationError, withMonitoringContext, type Operation,
} from "./monitoring.ts";

/** Times server work, not network transfer or later React streaming. */
export async function monitorOperation<T>(operation: Operation, run: () => Promise<T>): Promise<T> {
  return withMonitoringContext(operation, async () => {
    const started = process.hrtime.bigint();
    let outcome: "success" | "rejected" | "error" | "control_flow" = "success";
    let status: number | undefined;
    try {
      const result = await run();
      if (result instanceof Response) {
        status = result.status;
        if (status >= 500) outcome = "error";
        else if (status >= 400) outcome = "rejected";
      } else if (result && typeof result === "object" && "error" in result && result.error) {
        outcome = "rejected";
      }
      return result;
    } catch (error) {
      // Redirects, notFound, and dynamic-rendering signals retain their behavior.
      try { unstable_rethrow(error); } catch (controlFlow) {
        outcome = "control_flow";
        throw controlFlow;
      }
      if (isExpectedError(error)) {
        outcome = "rejected";
        markOutcome("rejected");
        throw error;
      }
      outcome = "error";
      reportError(error);
      throw safeOperationError();
    } finally {
      recordOperation(Number(process.hrtime.bigint() - started) / 1_000_000, outcome, status);
    }
  });
}
