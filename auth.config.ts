import type { NextAuthConfig } from "next-auth";

const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  process.env.BETTER_AUTH_SECRET;

export const authConfig = {
  secret: authSecret,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtectedPage =
        nextUrl.pathname === "/" || nextUrl.pathname.startsWith("/remove-hours");
      if (isProtectedPage) return isLoggedIn;
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
