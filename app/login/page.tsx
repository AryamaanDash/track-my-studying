import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { BookOpen, Lock, Mail } from "lucide-react";
import { auth, signIn } from "@/auth";
import JournalAuthPage from "@/components/JournalAuthPage";

const loginErrorMessages: Record<string, string> = {
  invalid_credentials: "That email and password combination didn't match our records.",
  missing_fields: "Enter both your email address and password to sign in.",
  server: "We couldn't sign you in right now. Please try again in a moment.",
};

const loginSuccessMessages: Record<string, string> = {
  account_created: "Your account is ready. Sign in below to start tracking your study time.",
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
}) {
  await connection();

  const session = await auth();

  if (session?.user?.email) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const errorMessage = loginErrorMessages[getSearchParam(params.error) ?? ""];
  const successMessage = loginSuccessMessages[getSearchParam(params.success) ?? ""];

  return (
    <JournalAuthPage
      activePage="login"
      title="Welcome back."
      description="Sign in to turn the page and continue recording the work you have done."
      annotation="Continue where you left off"
      alternatePrompt="Need a new journal?"
      alternateHref="/register"
      alternateLabel="Sign up"
    >
      <div className="journal-auth-messages">
        {successMessage ? (
          <p className="journal-auth-message journal-auth-message--success" role="status">
            {successMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="journal-auth-message journal-auth-message--error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>

      <form
        action={async (formData) => {
          "use server";

          const emailValue = formData.get("email");
          const passwordValue = formData.get("password");
          const email =
            typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
          const password =
            typeof passwordValue === "string" ? passwordValue : "";

          if (!email || !password) {
            redirect("/login?error=missing_fields");
          }

          let errorCode: "invalid_credentials" | "server" | null = null;

          try {
            await signIn("credentials", {
              email,
              password,
              redirectTo: "/dashboard",
            });
          } catch (error) {
            if (error instanceof AuthError) {
              errorCode =
                error.type === "CredentialsSignin" ? "invalid_credentials" : "server";
            } else {
              throw error;
            }
          }

          redirect(`/login?error=${errorCode ?? "server"}`);
        }}
        className="journal-auth-form"
      >
        <div className="journal-auth-field">
          <label htmlFor="login-email">
            <Mail aria-hidden="true" />
            Email address
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="journal-auth-field">
          <label htmlFor="login-password">
            <Lock aria-hidden="true" />
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" className="journal-auth-submit">
          <BookOpen aria-hidden="true" />
          Open my journal
        </button>
      </form>
    </JournalAuthPage>
  );
}
