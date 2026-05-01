import Link from "next/link";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Lock, Mail } from "lucide-react";
import { auth, signIn } from "@/auth";

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
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-50 tracking-tight mb-2">
            TrackMy<span className="text-emerald-500">Studying</span>
          </h1>
          <p className="text-neutral-400 text-sm">Sign in to track your study sessions.</p>
        </div>

        {successMessage ? (
          <p className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
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
              autoComplete="current-password"
              required
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-50 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button type="submit" className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-50 font-semibold py-3 px-4 rounded-xl transition-colors">
            Sign in with Password
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          Need an account?{" "}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
