"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type StudyCalendarSession = {
  id: string;
  subject: string;
  hours: number;
  date: string;
};

type DaySummary = {
  date: Date;
  dateKey: string;
  totalHours: number;
  subjectTotals: Record<string, number>;
};

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const selectedDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

const dayNames = Array.from({ length: 7 }, (_, dayIndex) =>
  weekdayFormatter.format(new Date(2024, 0, dayIndex + 7))
);

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getSubjectColor(subject: string) {
  const normalizedSubject = subject.trim().toLowerCase();
  let hash = 0;

  for (let index = 0; index < normalizedSubject.length; index += 1) {
    hash = (hash * 31 + normalizedSubject.charCodeAt(index)) >>> 0;
  }

  const hue = hash % 360;
  const saturation = 62 + (hash % 14);
  const lightness = 42 + (hash % 10);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function parseSessionDateKey(session: StudyCalendarSession) {
  const sessionDate = new Date(session.date);

  if (Number.isNaN(sessionDate.getTime())) return null;

  return {
    date: sessionDate,
    dateKey: getDateKey(sessionDate),
  };
}

function getInitialDate(sessions: StudyCalendarSession[], fallbackDate: string) {
  const initialDate = sessions[0] ? new Date(sessions[0].date) : new Date(fallbackDate);

  if (!Number.isNaN(initialDate.getTime())) return initialDate;

  return new Date(fallbackDate);
}

function formatHours(hours: number) {
  return `${hours.toFixed(1)} hr${hours === 1 ? "" : "s"}`;
}

export default function StudyCalendar({
  sessions,
  fallbackDate,
}: {
  sessions: StudyCalendarSession[];
  fallbackDate: string;
}) {
  const initialDate = getInitialDate(sessions, fallbackDate);
  const [monthCursor, setMonthCursor] = useState(() => getMonthStart(initialDate));
  const [selectedDateKey, setSelectedDateKey] = useState(() => getDateKey(initialDate));

  const summariesByDate = useMemo(() => {
    return sessions.reduce<Record<string, DaySummary>>((acc, session) => {
      const parsedDate = parseSessionDateKey(session);

      if (!parsedDate) return acc;

      acc[parsedDate.dateKey] ??= {
        date: parsedDate.date,
        dateKey: parsedDate.dateKey,
        totalHours: 0,
        subjectTotals: {},
      };

      acc[parsedDate.dateKey].totalHours += session.hours;
      acc[parsedDate.dateKey].subjectTotals[session.subject] =
        (acc[parsedDate.dateKey].subjectTotals[session.subject] || 0) + session.hours;

      return acc;
    }, {});
  }, [sessions]);

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(monthCursor);
    const firstWeekday = monthCursor.getDay();

    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: daysInMonth }, (_, dayIndex) => {
        const date = new Date(
          monthCursor.getFullYear(),
          monthCursor.getMonth(),
          dayIndex + 1
        );
        const dateKey = getDateKey(date);

        return {
          date,
          dateKey,
          dayNumber: dayIndex + 1,
          summary: summariesByDate[dateKey],
        };
      }),
    ];
  }, [monthCursor, summariesByDate]);

  const selectedSummary = summariesByDate[selectedDateKey];
  const selectedDate = selectedSummary?.date ?? new Date(`${selectedDateKey}T00:00:00`);
  const selectedLabel = Number.isNaN(selectedDate.getTime())
    ? selectedDateKey
    : selectedDateFormatter.format(selectedDate);

  const selectedDayData = Object.entries(selectedSummary?.subjectTotals ?? {})
    .map(([subject, hours]) => ({
      subject,
      hours,
      color: getSubjectColor(subject),
    }))
    .sort((a, b) => b.hours - a.hours || a.subject.localeCompare(b.subject));

  const chartHeight = Math.max(240, selectedDayData.length * 48 + 96);

  function goToPreviousMonth() {
    setMonthCursor(
      (currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  }

  function goToNextMonth() {
    setMonthCursor(
      (currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  }

  return (
    <section className="mx-auto mt-8 max-w-7xl rounded-3xl border border-border bg-surface p-4 shadow-2xl md:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="h-5 w-5 text-accent" />
            Study Calendar
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label="Previous month"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-strong text-muted transition-colors hover:text-foreground"
            onClick={goToPreviousMonth}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-44 text-center text-sm font-semibold text-foreground">
            {monthFormatter.format(monthCursor)}
          </div>
          <button
            aria-label="Next month"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-strong text-muted transition-colors hover:text-foreground"
            onClick={goToNextMonth}
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wider text-muted">
            {dayNames.map((dayName) => (
              <div key={dayName}>{dayName}</div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`blank-${index}`} className="h-16 md:h-20" />;
              }

              const isSelected = day.dateKey === selectedDateKey;
              const totalHours = day.summary?.totalHours ?? 0;
              const hasSessions = totalHours > 0;

              return (
                <button
                  key={day.dateKey}
                  aria-label={`${selectedDateFormatter.format(day.date)}: ${formatHours(
                    totalHours
                  )} studied`}
                  aria-pressed={isSelected}
                  className={`flex h-16 flex-col items-start justify-between rounded-xl border p-2 text-left transition-colors md:h-20 ${
                    isSelected
                      ? "border-accent bg-accent-soft text-foreground ring-2 ring-accent"
                      : "border-border bg-background text-foreground hover:border-accent hover:bg-surface-strong"
                  }`}
                  onClick={() => setSelectedDateKey(day.dateKey)}
                  type="button"
                >
                  <span className="text-sm font-semibold">{day.dayNumber}</span>
                  <span
                    className={`text-[11px] leading-tight ${
                      hasSessions ? "text-accent" : "text-muted"
                    }`}
                  >
                    {hasSessions ? formatHours(totalHours) : "0.0 hrs"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{selectedLabel}</h3>
              <p className="text-xs uppercase tracking-wider text-muted">Daily subjects</p>
            </div>
            <span className="text-sm font-semibold text-accent">
              {formatHours(selectedSummary?.totalHours ?? 0)}
            </span>
          </div>

          {selectedDayData.length > 0 ? (
            <div style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={selectedDayData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
                >
                  <XAxis
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--chart-axis)"
                    tickLine={false}
                    type="number"
                  />
                  <YAxis
                    axisLine={false}
                    dataKey="subject"
                    fontSize={12}
                    stroke="var(--chart-axis)"
                    tickFormatter={(subject) =>
                      String(subject).length > 13
                        ? `${String(subject).slice(0, 13)}...`
                        : String(subject)
                    }
                    tickLine={false}
                    type="category"
                    width={96}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--chart-tooltip-bg)",
                      border: "1px solid var(--chart-tooltip-border)",
                      borderRadius: "8px",
                      color: "var(--chart-tooltip-fg)",
                    }}
                    cursor={{ fill: "var(--chart-cursor)" }}
                    formatter={(value) => [`${Number(value).toFixed(1)} hrs`, "Hours"]}
                    labelFormatter={(subject) => String(subject)}
                  />
                  <Bar dataKey="hours" radius={[0, 6, 6, 0]}>
                    {selectedDayData.map((entry) => (
                      <Cell key={entry.subject} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
              No studying was logged for this date.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
