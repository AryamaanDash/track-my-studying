import { auth } from "@/auth";
import StudyJournal from "@/components/StudyJournal";
import {
  getServerElapsedMs,
  logServerPerformance,
  shouldLogServerPerformance,
  startServerTimer,
} from "@/lib/server-performance";
import {
  getCachedLifetimeStudyHours,
  getCachedPreviousStudySession,
  getCachedStudyCalendarData,
  getCachedStudyChartData,
} from "@/lib/study-cache";
import { getUtcMonthKey } from "@/lib/study-session-data";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { after, connection } from "next/server";

export const metadata: Metadata = {
  title: "Study Journal",
};

const todayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export default async function DashboardPage() {
  const loadStarted = startServerTimer();
  const timings: Record<string, number> = {};

  await connection();

  const authStarted = startServerTimer();
  const session = await auth();
  timings.authMs = getServerElapsedMs(authStarted);
  const userId = session?.user?.id;

  if (!userId) redirect("/login");

  async function measureQuery<T>(name: string, operation: () => Promise<T>) {
    const started = startServerTimer();
    const result = await operation();
    timings[name] = getServerElapsedMs(started);
    return result;
  }

  const now = new Date();
  const calendarMonth = getUtcMonthKey(now);
  const databaseStarted = startServerTimer();
  const [previousSession, totalHours, initialChartData, initialCalendarData] =
    await Promise.all([
      measureQuery("latestSessionQueryMs", () =>
        getCachedPreviousStudySession(userId)
      ),
      measureQuery("lifetimeTotalQueryMs", () =>
        getCachedLifetimeStudyHours(userId)
      ),
      measureQuery("monthChartQueryMs", () =>
        getCachedStudyChartData(userId, "month")
      ),
      measureQuery("calendarQueryMs", () =>
        getCachedStudyCalendarData(userId, calendarMonth)
      ),
    ]);
  timings.databaseQueriesMs = getServerElapsedMs(databaseStarted);

  const currentDateIso = now.toISOString();
  const currentDateKey = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const dataLoadMs = getServerElapsedMs(loadStarted);

  if (shouldLogServerPerformance()) {
    after(() => {
      logServerPerformance("dashboard", {
        ...timings,
        dataLoadMs,
        totalResponseMs: getServerElapsedMs(loadStarted),
      });
    });
  }

  return (
    <StudyJournal
      previousSession={
        previousSession ?? undefined
      }
      initialChartData={initialChartData}
      initialCalendarData={initialCalendarData ?? {
        month: calendarMonth,
        points: [],
      }}
      todayLabel={todayFormatter.format(now)}
      todayDateKey={currentDateKey}
      referenceDate={currentDateIso}
      totalHours={totalHours}
    />
  );
}
