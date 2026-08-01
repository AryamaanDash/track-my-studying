import { auth, signOut } from "@/auth";
import { addStudySession } from "@/app/actions";
import StudyCalendar from "@/components/StudyCalendar";
import StudyCharts from "@/components/StudyCharts";
import StudySessionDateTimeInput from "@/components/StudySessionDateTimeInput";
import ThemeSelector from "@/components/ThemeSelector";
import WeeklyStudyCelebration from "@/components/WeeklyStudyCelebration";
import { prisma } from "@/lib/prisma";
import { LogOut, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  await connection();

  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      email: true,
      studySessions: {
        select: {
          id: true,
          subject: true,
          hours: true,
          date: true,
        },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!user) redirect("/login");

  const totalHours = user.studySessions.reduce(
    (sum, studySession) => sum + studySession.hours,
    0
  );
  const chartSessions = user.studySessions.map((studySession) => ({
    ...studySession,
    date: studySession.date.toISOString(),
  }));
  const calendarFallbackDate = new Date().toISOString();

  return (
    <div className="min-h-screen bg-background px-5 py-6 font-sans text-foreground md:px-10 md:py-8">
      <header className="mx-auto mb-16 flex max-w-5xl flex-wrap items-center justify-between gap-5 md:mb-24">
        <Link className="text-sm font-semibold tracking-tight" href="/dashboard">
          Track My Studying
        </Link>

        <div className="flex flex-wrap items-center gap-3 text-sm md:gap-5">
          <Link
            href="/remove-hours"
            className="flex items-center gap-2 text-muted transition-colors hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
            Remove Hours
          </Link>
          <ThemeSelector />
          <span className="hidden text-sm text-muted lg:inline">{session.user.email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl">
        <section className="mb-16 max-w-3xl md:mb-24">
          <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.055em] md:text-7xl">
            Personal Study Dashboard
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted md:text-xl">
            Log focused work, understand where your time goes, and build a more
            consistent study practice.
          </p>
        </section>

        <WeeklyStudyCelebration sessions={chartSessions} />

        <section className="mb-5 flex items-end justify-between border-b border-border pb-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted">Overview</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Your study record</h2>
          </div>
          <div className="text-right">
            <span className="block text-4xl font-semibold tracking-tight">
              {totalHours.toFixed(1)}
            </span>
            <span className="text-xs uppercase tracking-wider text-muted">total hours</span>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-10 xl:grid-cols-[0.72fr_1.28fr]">
          <section>
            <div className="border-b border-border pb-10 xl:border-b-0 xl:border-r xl:pb-0 xl:pr-10">
              <h2 className="mb-7 text-lg font-semibold">Log a session</h2>
              <form action={addStudySession} className="space-y-4">
                <div>
                  <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted">
                    Subject
                  </label>
                  <input
                    name="subject"
                    type="text"
                    placeholder="e.g. ICS 45C"
                    required
                    className="field"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted">
                    Hours
                  </label>
                  <input
                    name="hours"
                    type="number"
                    step="0.1"
                    placeholder="2.5"
                    required
                    className="field"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted">
                    When?
                  </label>
                  <StudySessionDateTimeInput />
                </div>
                <button
                  type="submit"
                  className="mt-2 flex w-full items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-80"
                >
                  Save session
                </button>
              </form>
            </div>
          </section>

          <section>
            {user.studySessions.length > 0 ? (
              <StudyCharts sessions={chartSessions} />
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center border-y border-border p-6 text-center text-muted">
                <p className="text-lg text-foreground">Your record starts here.</p>
                <p className="mt-2 text-sm">
                  Log your first study session to generate insights.
                </p>
              </div>
            )}
          </section>
        </div>

        <StudyCalendar sessions={chartSessions} fallbackDate={calendarFallbackDate} />

        <footer className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-border py-7 text-sm text-muted">
          <span>Track My Studying</span>
          <span>
            Made by{" "}
            <a
              href="https://aryamaan-dash.vercel.app/"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              Aryamaan Dash
            </a>
          </span>
        </footer>
      </main>
    </div>
  );
}
