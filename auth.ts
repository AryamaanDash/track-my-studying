// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import WebAuthn from "next-auth/providers/webauthn";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // Required for Credentials provider
  providers: [
    WebAuthn, // Automatically handles Biometrics/Passkeys
    Credentials({
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "student@uci.edu" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

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
  pages: {
    signIn: "/login", // We will build this custom page next
  },
});