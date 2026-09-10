import "server-only";
import { createRateLimitService } from "./rate-limit-core";

export { getClientIp, rateLimitResponse } from "./rate-limit-core";
export const checkRateLimit = createRateLimitService();
