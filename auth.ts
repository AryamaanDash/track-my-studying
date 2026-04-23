// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import WebAuthn from "next-auth/providers/webauthn";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

// IMPORTANT: This must point to your lib/prisma.ts that has the Pool and Adapter logic
import { prisma } from "./lib/prisma"; 

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    WebAuthn,
    Credentials({
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // This call was likely the one hitting 127.0.0.1
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user || !user.passwordHash) return null;

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (passwordsMatch) return user;
        return null;
      },
    }),
  ],
  experimental: {
    enableWebAuthn: true,
  },
  // Ensure this is set for production redirects
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
});