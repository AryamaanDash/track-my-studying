import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { UserPlus, Mail, Lock } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const registerErrorMessages: Record<string, string> = {
  missing_fields: "Enter both an email address and a password to create your account.",
  invalid_email: "Enter a valid email address.",
  invalid_password: "Choose a password between 8 and 72 characters long.",
  account_exists: "An account with that email address already exists.",
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string | string[];
  }>;
}) {
  await connection();

  const session = await auth();

  if (session?.user?.email) {
    redirect("/");
  }

  const params = await searchParams;
  const errorMessage = registerErrorMessages[getSearchParam(params.error) ?? ""];

  async function registerUser(formData: FormData) {
    "use server";

    const emailValue = formData.get("email");
    const passwordValue = formData.get("password");
    const email =
      typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
    const password = typeof passwordValue === "string" ? passwordValue : "";
    const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!email || !password) {
      redirect("/register?error=missing_fields");
    }

    if (!hasValidEmail) {
      redirect("/register?error=invalid_email");
    }

    if (password.length < 8 || password.length > 72) {
      redirect("/register?error=invalid_password");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      redirect("/register?error=account_exists");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    let errorCode: "account_exists" | null = null;

    try {
      await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        errorCode = "account_exists";
      } else {
        throw error;
      }
    }

    if (errorCode) {
      redirect(`/register?error=${errorCode}`);
    }

    redirect("/login?success=account_created");
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-50 tracking-tight mb-2">
            Create <span className="text-emerald-500">Account</span>
          </h1>
          <p className="text-neutral-400 text-sm">Sign up to start tracking your hours.</p>
        </div>

        {errorMessage ? (
          <p className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </p>
        ) : null}

        <form action={registerUser} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-neutral-500" />
            <input
              name="email"
              type="email"
              placeholder="Email address"
              autoComplete="email"
              required
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-50 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-neutral-500" />
            <input
              name="password"
              type="password"
              placeholder="Password"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-50 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <UserPlus className="w-5 h-5" />
            Register
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
