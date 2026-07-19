import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, CalendarClock, LogOut, Trash2 } from "lucide-react";
import { auth, signOut } from "@/auth";
import RemoveStudySessionButton from "@/components/RemoveStudySessionButton";
import ThemeSelector from "@/components/ThemeSelector";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Remove Logged Hours",
};

const sessionDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function RemoveHoursPage() {
  await connection();

  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      studySessions: {
        select: {
          id: true,
          subject: true,
          hours: true,
          date: true,
        },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!user) redirect("/login");

  const totalHours = user.studySessions.reduce(
    (sum, studySession) => sum + studySession.hours,
    0
  );

  return (
    <div className="min-h-screen bg-background p-6 font-sans text-foreground md:p-10">
      <header className="mx-auto mb-10 flex max-w-5xl flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link
            href="/"
            className="mb-3 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
            <Trash2 className="h-6 w-6 text-danger" />
            Remove Logged Hours
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <ThemeSelector />
          <span className="text-sm text-muted">{user.email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-danger">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6">
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-border bg-surface p-5">
            <span className="text-xs uppercase tracking-wider text-muted">
              Sessions
            </span>
            <p className="mt-2 text-3xl font-bold">
              {user.studySessions.length}
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-5">
            <span className="text-xs uppercase tracking-wider text-muted">
              Logged Hours
            </span>
            <p className="mt-2 text-3xl font-bold text-accent">
              {totalHours.toFixed(1)}
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-5">
            <span className="text-xs uppercase tracking-wider text-muted">
              Sort
            </span>
            <p className="mt-2 text-lg font-semibold">Oldest First</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
          {user.studySessions.length > 0 ? (
            <ul className="divide-y divide-border">
              {user.studySessions.map((studySession) => {
                const dateLabel = sessionDateFormatter.format(studySession.date);

                return (
                  <li
                    key={studySession.id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold">
                        {studySession.subject}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                        <CalendarClock className="h-4 w-4 shrink-0" />
                        {dateLabel}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <span className="rounded-xl bg-accent-soft px-3 py-2 text-sm font-bold text-accent">
                        {studySession.hours.toFixed(1)} hrs
                      </span>
                      <RemoveStudySessionButton
                        sessionId={studySession.id}
                        subject={studySession.subject}
                        hours={studySession.hours}
                        dateLabel={dateLabel}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center text-muted">
              <Trash2 className="mb-4 h-12 w-12 opacity-20" />
              <p>No logged hours to remove.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
