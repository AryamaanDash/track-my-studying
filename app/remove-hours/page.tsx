import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  FilePenLine,
  LogOut,
  RotateCcw,
  Sprout,
} from "lucide-react";
import { auth, signOut } from "@/auth";
import RemoveStudySessionButton from "@/components/RemoveStudySessionButton";
import EditStudySessionButton from "@/components/EditStudySessionButton";
import ThemeSelector from "@/components/ThemeSelector";
import {
  getCachedLifetimeStudyHours,
  getCachedStudySessionCount,
  getCachedStudySessionPage,
  studySessionPageSize,
} from "@/lib/study-cache";
import { getSubjectColor } from "@/lib/study-colors";

export const metadata: Metadata = {
  title: "Edit Logged Hours",
};

const sessionDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

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

  if (!userId) {
    redirect("/login");
  }

  const params = await searchParams;
  const cursor = getSearchParam(params.cursor)?.trim() || undefined;
  const requestedPage = Number(getSearchParam(params.page) ?? "1");
  const currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const [sessionCount, totalHours, sessionRows] = await Promise.all([
    getCachedStudySessionCount(userId),
    getCachedLifetimeStudyHours(userId),
    getCachedStudySessionPage(userId, cursor ?? null),
  ]);

  const hasMore = sessionRows.length > studySessionPageSize;
  const studySessions = hasMore
    ? sessionRows.slice(0, studySessionPageSize)
    : sessionRows;
  const nextCursor = hasMore
    ? studySessions[studySessions.length - 1]?.id
    : undefined;

  return (
    <div className="journal-desk remove-hours-desk">
      <main className="study-journal remove-hours-journal">
        <section
          className="journal-page journal-page--left remove-hours-page remove-hours-page--context"
          aria-labelledby="remove-hours-title"
        >
          <header className="journal-brand">
            <Sprout aria-hidden="true" />
            <div>
              <Link href="/dashboard">Track My Studying</Link>
              <p>Personal Study Journal</p>
            </div>
          </header>

          <div className="remove-hours-intro">
            <p className="remove-hours-eyebrow">A small correction</p>
            <div className="remove-hours-title-row">
              <h1 id="remove-hours-title">Edit Logged Hours</h1>
              <FilePenLine aria-hidden="true" />
            </div>
            <p className="remove-hours-description">
              Revise a study entry or remove one logged by mistake.
            </p>

            <dl
              className="remove-hours-summary"
              aria-label="Study history summary"
            >
              <div>
                <dt>Total sessions</dt>
                <dd>{sessionCount}</dd>
              </div>
              <div>
                <dt>Total logged hours</dt>
                <dd>{totalHours.toFixed(1)}</dd>
              </div>
            </dl>
          </div>

          <footer className="remove-hours-context-footer">
            <nav
              className="journal-utilities remove-hours-utilities"
              aria-label="Journal utilities"
            >
              <Link href="/dashboard" className="journal-utility">
                <ArrowLeft aria-hidden="true" />
                Back to Dashboard
              </Link>
              <ThemeSelector />
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button type="submit" className="journal-utility">
                  <LogOut aria-hidden="true" />
                  Sign Out
                </button>
              </form>
            </nav>
            <p>Revise an entry or remove one that was logged by mistake.</p>
          </footer>
        </section>

        <section
          className="journal-page journal-page--right remove-hours-page remove-hours-page--history"
          aria-labelledby="study-history-title"
        >
          <header className="study-history-header">
            <div>
              <p>Recorded sessions</p>
              <h2 id="study-history-title">Study History</h2>
            </div>
            <span className="study-history-page-number">Page {currentPage}</span>
          </header>

          <div className="study-history-columns" aria-hidden="true">
            <span>Subject / date</span>
            <span>Hours</span>
          </div>

          <div className="study-history-scroll">
            {studySessions.length > 0 ? (
              <ol
                className="study-history-ledger"
                start={(currentPage - 1) * studySessionPageSize + 1}
              >
                {studySessions.map((studySession) => {
                  const dateLabel = sessionDateFormatter.format(
                    new Date(studySession.date)
                  );
                  const sessionStyle = {
                    "--session-accent": getSubjectColor(studySession.subject),
                  } as CSSProperties;

                  return (
                    <li key={studySession.id} style={sessionStyle}>
                      <span className="study-history-accent" aria-hidden="true" />
                      <div className="study-history-entry">
                        <p>{studySession.subject}</p>
                        <time dateTime={studySession.date}>{dateLabel}</time>
                        {studySession.journal ? (
                          <p className="study-history-note-preview">
                            {studySession.journal}
                          </p>
                        ) : null}
                      </div>
                      <strong>{studySession.hours.toFixed(1)} hrs</strong>
                      <div className="study-history-actions">
                        <EditStudySessionButton
                          sessionId={studySession.id}
                          subject={studySession.subject}
                          hours={studySession.hours}
                          date={studySession.date}
                          journal={studySession.journal}
                        />
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
              </ol>
            ) : (
              <div className="study-history-empty">
                <BookOpenText aria-hidden="true" />
                <p>
                  {sessionCount > 0
                    ? "No sessions remain on this page."
                    : "No logged hours to remove."}
                </p>
                <span>Your study history will be written here.</span>
              </div>
            )}
          </div>

          {cursor || nextCursor ? (
            <nav
              className="study-history-pagination"
              aria-label="Study session pages"
            >
              <p>Up to {studySessionPageSize} entries per page</p>
              <div>
                {cursor ? (
                  <Link href="/remove-hours">
                    <RotateCcw aria-hidden="true" />
                    First page
                  </Link>
                ) : (
                  <span aria-hidden="true" />
                )}
                {nextCursor ? (
                  <Link
                    href={`/remove-hours?cursor=${encodeURIComponent(
                      nextCursor
                    )}&page=${currentPage + 1}`}
                  >
                    Next 50
                    <ArrowRight aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            </nav>
          ) : null}
        </section>
      </main>
    </div>
  );
}
