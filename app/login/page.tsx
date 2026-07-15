import Link from "next/link";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Lock, Mail } from "lucide-react";
import { auth, signIn } from "@/auth";
import ThemeSelector from "@/components/ThemeSelector";

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
    redirect("/");
  }

  const params = await searchParams;
  const errorMessage = loginErrorMessages[getSearchParam(params.error) ?? ""];
  const successMessage = loginSuccessMessages[getSearchParam(params.success) ?? ""];

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="absolute right-4 top-4">
        <ThemeSelector />
      </div>

      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
            TrackMy<span className="text-accent">Studying</span>
          </h1>
          <p className="text-muted text-sm">Sign in to track your study sessions.</p>
        </div>

        {successMessage ? (
          <p className="mb-6 rounded-2xl border border-success-border bg-success-soft px-4 py-3 text-sm text-success-foreground">
            {successMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mb-6 rounded-2xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
            {errorMessage}
          </p>
        ) : null}

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
                redirectTo: "/",
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
          className="space-y-4"
        >
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-muted" />
            <input
              name="email"
              type="email"
              placeholder="Email address"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-border bg-background py-3 pl-12 pr-4 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted" />
            <input
              name="password"
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-border bg-background py-3 pl-12 pr-4 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <button type="submit" className="w-full rounded-xl bg-button px-4 py-3 font-semibold text-button-foreground transition-colors hover:bg-button-hover">
            Sign in with Password
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Need an account?{" "}
          <Link href="/register" className="text-accent hover:text-accent-hover">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
