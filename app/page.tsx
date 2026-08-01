import ThemeSelector from "@/components/ThemeSelector";
import { auth } from "@/auth";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  Clock3,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Study with intention",
  description:
    "Log study sessions, understand your habits, and build a more consistent study practice.",
};

const benefits = [
  {
    number: "01",
    title: "Log the work",
    description:
      "Capture what you studied, how long you focused, and when the session happened.",
  },
  {
    number: "02",
    title: "See your patterns",
    description:
      "Turn individual sessions into a clear view of your time, subjects, and consistency.",
  },
  {
    number: "03",
    title: "Build momentum",
    description:
      "Use an honest record of your progress to make the next study session easier to begin.",
  },
] as const;

export default async function HomePage() {
  await connection();

  const session = await auth();

  if (session?.user?.email) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background px-5 text-foreground md:px-10">
      <header className="mx-auto flex max-w-5xl items-center justify-between py-6 md:py-8">
        <Link className="text-sm font-semibold tracking-tight" href="/">
          Track My Studying
        </Link>

        <nav aria-label="Primary navigation" className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/login"
            className="hidden text-sm text-muted transition-colors hover:text-foreground sm:inline"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            Sign up
          </Link>
          <ThemeSelector />
        </nav>
      </header>

      <main className="mx-auto max-w-5xl">
        <section className="grid min-h-[calc(100vh-88px)] items-center gap-14 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.16em] text-muted">
              A clearer way to study
            </p>
            <h1 className="max-w-3xl text-6xl font-semibold leading-[0.9] tracking-[-0.065em] sm:text-7xl lg:text-[6.5rem]">
              Study with intention.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-muted md:text-xl">
              A simple study tracker that helps you record focused work, understand
              where your time goes, and build a routine that lasts.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-80"
              >
                Start tracking <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-2 py-3 text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                I already have an account
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <Check className="h-4 w-4" /> Free to start. Your data stays private.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
            <div className="border border-border bg-surface p-5 shadow-[18px_18px_0_var(--surface-strong)] sm:p-7">
              <div className="flex items-start justify-between border-b border-border pb-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    This week
                  </p>
                  <p className="mt-2 text-4xl font-semibold tracking-tight">12.5 hrs</p>
                </div>
                <Clock3 className="h-5 w-5 text-muted" />
              </div>

              <div className="grid grid-cols-7 items-end gap-2 border-b border-border py-7">
                {[38, 64, 26, 82, 54, 92, 46].map((height, index) => (
                  <div key={height} className="flex flex-col items-center gap-2">
                    <div className="flex h-28 w-full items-end bg-surface-strong">
                      <div
                        className="w-full bg-foreground"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="font-mono text-[9px] text-muted">
                      {"MTWTFSS"[index]}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-5">
                <div className="flex items-center justify-between text-sm">
                  <span>Computer science</span>
                  <span className="font-mono text-xs text-muted">6.0 hrs</span>
                </div>
                <div className="h-1 bg-surface-strong">
                  <div className="h-full w-[72%] bg-foreground" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Mathematics</span>
                  <span className="font-mono text-xs text-muted">4.5 hrs</span>
                </div>
                <div className="h-1 bg-surface-strong">
                  <div className="h-full w-[54%] bg-foreground" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-border py-20 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-muted">Why it works</p>
              <h2 className="mt-3 max-w-xs text-3xl font-semibold leading-tight tracking-[-0.035em] md:text-4xl">
                Less friction. More awareness.
              </h2>
            </div>

            <ol className="border-t border-border">
              {benefits.map((benefit) => (
                <li
                  key={benefit.number}
                  className="grid gap-3 border-b border-border py-7 sm:grid-cols-[3rem_0.65fr_1fr] sm:gap-5"
                >
                  <span className="font-mono text-xs text-muted">{benefit.number}</span>
                  <h3 className="font-semibold">{benefit.title}</h3>
                  <p className="leading-7 text-muted">{benefit.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="grid gap-px border-y border-border bg-border md:grid-cols-3">
          <article className="bg-background p-7 md:p-9">
            <Clock3 className="h-5 w-5" />
            <h3 className="mt-10 text-xl font-semibold">Fast session logging</h3>
            <p className="mt-3 leading-7 text-muted">
              Add a subject, duration, and date without breaking your focus.
            </p>
          </article>
          <article className="bg-background p-7 md:p-9">
            <BarChart3 className="h-5 w-5" />
            <h3 className="mt-10 text-xl font-semibold">Useful visual trends</h3>
            <p className="mt-3 leading-7 text-muted">
              Compare study time across days, subjects, and meaningful timeframes.
            </p>
          </article>
          <article className="bg-background p-7 md:p-9">
            <CalendarDays className="h-5 w-5" />
            <h3 className="mt-10 text-xl font-semibold">A record you can trust</h3>
            <p className="mt-3 leading-7 text-muted">
              Look back at the work you did and see consistency taking shape.
            </p>
          </article>
        </section>

        <section className="py-24 text-center md:py-36">
          <p className="font-mono text-xs uppercase tracking-wider text-muted">Begin today</p>
          <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-6xl">
            Your progress deserves a record.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted">
            Start with one session. The useful picture builds from there.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-80"
            >
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link className="px-3 py-3 text-sm text-muted hover:text-foreground" href="/login">
              Log in
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 border-t border-border py-7 text-sm text-muted">
        <span>Track My Studying</span>
        <span>Made for focused, consistent work.</span>
      </footer>
    </div>
  );
}
