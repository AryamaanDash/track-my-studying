// auth.config.ts
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname === "/";
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      }
      return true;
    },
  },
  providers: [
    // We leave this empty or minimal here; 
    // the actual logic will stay in auth.ts
    Credentials({}), 
  ],
} satisfies NextAuthConfig;