import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Lock, Mail, UserPlus } from "lucide-react";
import { auth } from "@/auth";
import JournalAuthPage from "@/components/JournalAuthPage";
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
    redirect("/dashboard");
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
    <JournalAuthPage
      activePage="register"
      title="Begin your journal."
      description="Create an account and give every focused hour a place to become visible progress."
      annotation="A fresh first page"
      alternatePrompt="Already keep a journal here?"
      alternateHref="/login"
      alternateLabel="Log in"
    >
      <div className="journal-auth-messages">
        {errorMessage ? (
          <p className="journal-auth-message journal-auth-message--error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>

      <form action={registerUser} className="journal-auth-form">
        <div className="journal-auth-field">
          <label htmlFor="register-email">
            <Mail aria-hidden="true" />
            Email address
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="journal-auth-field">
          <label htmlFor="register-password">
            <Lock aria-hidden="true" />
            Password
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            placeholder="Choose a password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            aria-describedby="register-password-hint"
            required
          />
          <span id="register-password-hint" className="journal-auth-hint">
            Use 8–72 characters.
          </span>
        </div>

        <button type="submit" className="journal-auth-submit">
          <UserPlus aria-hidden="true" />
          Create my journal
        </button>
      </form>
    </JournalAuthPage>
  );
}
