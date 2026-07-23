"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, TrendingUp } from "lucide-react";
import styles from "./WeeklyStudyCelebration.module.css";

type WeeklyStudySession = {
  id: string;
  hours: number;
  date: string;
};

const minuteInMilliseconds = 60 * 1000;

function isSundayMorning(date: Date) {
  return date.getDay() === 0 && date.getHours() < 12;
}

function getMondayStart(date: Date) {
  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);

  const daysSinceMonday = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);

  return weekStart;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function roundToTenth(value: number) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function formatHours(hours: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(hours) ? 0 : 1,
  }).format(hours);
}

function sumHoursBetween(sessions: WeeklyStudySession[], start: Date, end: Date) {
  const startTime = start.getTime();
  const endTime = end.getTime();

  return sessions.reduce((total, session) => {
    const sessionTime = new Date(session.date).getTime();

    if (Number.isNaN(sessionTime) || sessionTime < startTime || sessionTime >= endTime) {
      return total;
    }

    return total + session.hours;
  }, 0);
}

export default function WeeklyStudyCelebration({
  sessions,
}: {
  sessions: WeeklyStudySession[];
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    function refreshNow() {
      setNow(new Date());
    }

    refreshNow();

    const intervalId = window.setInterval(refreshNow, minuteInMilliseconds);

    return () => window.clearInterval(intervalId);
  }, []);

  const shouldShow = now ? isSundayMorning(now) : false;

  const summary = useMemo(() => {
    if (!now || !shouldShow) return null;

    const currentWeekStart = getMondayStart(now);
    const nextWeekStart = addDays(currentWeekStart, 7);
    const previousWeekStart = addDays(currentWeekStart, -7);

    const currentWeekHours = roundToTenth(
      sumHoursBetween(sessions, currentWeekStart, nextWeekStart)
    );
    const previousWeekHours = roundToTenth(
      sumHoursBetween(sessions, previousWeekStart, currentWeekStart)
    );
    const increase = roundToTenth(currentWeekHours - previousWeekHours);

    return {
      currentWeekHours,
      hasIncrease: currentWeekHours > previousWeekHours,
      increase,
    };
  }, [now, sessions, shouldShow]);

  if (!summary) return null;

  const currentWeekHours = formatHours(summary.currentWeekHours);
  const message = summary.hasIncrease
    ? `Congrats! You studied ${currentWeekHours} hours this week! That is a ${formatHours(
        summary.increase
      )} hour increase!`
    : `Congrats! You have studied for ${currentWeekHours} hours this week!`;

  return (
    <section
      aria-live="polite"
      className={`mx-auto mb-8 max-w-7xl overflow-hidden rounded-3xl border border-success-border bg-success-soft p-5 text-success-foreground shadow-2xl ${styles.card}`}
    >
      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-strong">
              Sunday check-in
            </p>
            <p className="mt-1 text-lg font-semibold leading-snug text-foreground">
              {message}
            </p>
          </div>
        </div>

        <div
          className={`flex w-fit items-center gap-2 rounded-full border border-success-border bg-background px-4 py-2 text-sm font-semibold text-accent ${styles.metricPill}`}
        >
          <TrendingUp className="h-4 w-4" />
          {currentWeekHours} hrs
        </div>
      </div>
    </section>
  );
}
