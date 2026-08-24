"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, TrendingUp } from "lucide-react";

type WeeklyStudySession = {
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
    const sessionTime = new Date(
      /^\d{4}-\d{2}-\d{2}$/.test(session.date)
        ? `${session.date}T00:00:00`
        : session.date
    ).getTime();

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
    <section aria-live="polite" className="journal-weekly-note">
      <Sparkles aria-hidden="true" />
      <p>
        <span>Sunday check-in</span>
        {message}
      </p>
      <strong>
        <TrendingUp aria-hidden="true" />
        {currentWeekHours} hrs
      </strong>
    </section>
  );
}
