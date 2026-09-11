import type { Instrumentation } from "next";
import { operationForRoute, redactFrameworkError, reportError } from "./lib/monitoring.ts";

export const onRequestError: Instrumentation.onRequestError = (error, _request, context) => {
  // Never pass request.path (it includes query strings), headers, or the full
  // context/error to the sink. The route template is mapped to a fixed label.
  reportError(error, "request", operationForRoute(context.routePath));
  redactFrameworkError(error);
};
