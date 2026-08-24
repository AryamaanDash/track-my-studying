import { auth } from "@/auth";
import StudyJournal from "@/components/StudyJournal";
import { prisma } from "@/lib/prisma";
import {
  getServerElapsedMs,
  logServerPerformance,
  shouldLogServerPerformance,
  startServerTimer,
} from "@/lib/server-performance";
import {
  getStudyCalendarData,
  getStudyChartData,
  getUtcMonthKey,
} from "@/lib/study-session-data";
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
  const [previousSession, totalResult, initialChartData, initialCalendarData] =
    await Promise.all([
      measureQuery("latestSessionQueryMs", () =>
        prisma.studySession.findFirst({
          where: { userId },
          select: {
            subject: true,
            hours: true,
            date: true,
          },
          orderBy: [{ date: "desc" }, { id: "desc" }],
        })
      ),
      measureQuery("lifetimeTotalQueryMs", () =>
        prisma.studySession.aggregate({
          where: { userId },
          _sum: { hours: true },
        })
      ),
      measureQuery("monthChartQueryMs", () =>
        getStudyChartData(userId, "month", now)
      ),
      measureQuery("calendarQueryMs", () =>
        getStudyCalendarData(userId, calendarMonth)
      ),
    ]);
  timings.databaseQueriesMs = getServerElapsedMs(databaseStarted);

  const currentDateIso = now.toISOString();
  const currentDateKey = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const totalHours = totalResult._sum.hours ?? 0;
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
        previousSession
          ? {
              ...previousSession,
              date: previousSession.date.toISOString(),
            }
          : undefined
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
