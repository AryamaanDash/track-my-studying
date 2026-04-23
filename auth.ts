// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import WebAuthn from "next-auth/providers/webauthn";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

// IMPORT THE CENTRALIZED CLIENT INSTEAD OF CREATING A NEW ONE
import { prisma } from "./lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: "this_is_a_temporary_secret_just_to_test_if_it_works",
  session: { strategy: "jwt" }, 
  providers: [
    WebAuthn, 
    Credentials({
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "name@example.com" },
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
    signIn: "/login", 
  },
});