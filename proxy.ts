import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { checkRateLimit, getClientIp, rateLimitResponse } from "./lib/rate-limit";

const { auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async authorized(context) {
      const limit = await checkRateLimit("proxy", getClientIp(context.request.headers));
      if (!limit.allowed) return rateLimitResponse(limit);
      return authConfig.callbacks.authorized(context);
    },
  },
});

export default auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
