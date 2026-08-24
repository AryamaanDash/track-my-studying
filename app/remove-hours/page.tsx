import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  LogOut,
  RotateCcw,
  Trash2,
} from "lucide-react";
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

const pageSize = 50;

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RemoveHoursPage({
  searchParams,
}: {
  searchParams: Promise<{
    cursor?: string | string[];
    page?: string | string[];
  }>;
}) {
  await connection();

  const session = await auth();
  const userId = session?.user?.id;
  const email = session?.user?.email ?? "";

  if (!userId) {
    redirect("/login");
  }

  const params = await searchParams;
  const cursor = getSearchParam(params.cursor)?.trim() || undefined;
  const requestedPage = Number(getSearchParam(params.page) ?? "1");
  const currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const [sessionCount, totalResult, sessionRows] = await Promise.all([
    prisma.studySession.count({ where: { userId } }),
    prisma.studySession.aggregate({
      where: { userId },
      _sum: { hours: true },
    }),
    prisma.studySession.findMany({
      where: { userId },
      select: {
        id: true,
        subject: true,
        hours: true,
        date: true,
      },
      orderBy: [{ date: "asc" }, { id: "asc" }],
      take: pageSize + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
  ]);

  const hasMore = sessionRows.length > pageSize;
  const studySessions = hasMore ? sessionRows.slice(0, pageSize) : sessionRows;
  const nextCursor = hasMore
    ? studySessions[studySessions.length - 1]?.id
    : undefined;
  const totalHours = totalResult._sum.hours ?? 0;

  return (
    <div className="min-h-screen bg-background p-6 font-sans text-foreground md:p-10">
      <header className="mx-auto mb-10 flex max-w-5xl flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link
            href="/dashboard"
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
          <span className="text-sm text-muted">{email}</span>
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
              {sessionCount}
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
          {studySessions.length > 0 ? (
            <ul className="divide-y divide-border">
              {studySessions.map((studySession) => {
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
              <p>
                {sessionCount > 0
                  ? "No sessions remain on this page."
                  : "No logged hours to remove."}
              </p>
            </div>
          )}
        </section>

        {cursor || nextCursor ? (
          <nav
            aria-label="Study session pages"
            className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-surface p-4"
          >
            <p className="text-sm text-muted">
              Page {currentPage} · Up to {pageSize} sessions per page
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {cursor ? (
                <Link
                  href="/remove-hours"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-strong px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface-muted"
                >
                  <RotateCcw className="h-4 w-4" />
                  First Page
                </Link>
              ) : null}
              {nextCursor ? (
                <Link
                  href={`/remove-hours?cursor=${encodeURIComponent(
                    nextCursor
                  )}&page=${currentPage + 1}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-button px-4 py-2 text-sm font-semibold text-button-foreground transition-colors hover:bg-button-hover"
                >
                  Next 50
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </nav>
        ) : null}
      </main>
    </div>
  );
}
