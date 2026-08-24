"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSubjectColor } from "@/lib/study-colors";
import type { StudyCalendarData } from "@/lib/study-session-data";

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
  month: "short",
  day: "numeric",
});

const accessibleDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getInitialMonth(month: string, fallbackDate: string) {
  const initialMonth = new Date(`${month}-01T00:00:00`);
  if (!Number.isNaN(initialMonth.getTime())) return initialMonth;

  const fallback = new Date(fallbackDate);
  return getMonthStart(Number.isNaN(fallback.getTime()) ? new Date() : fallback);
}

function getInitialDateKey(month: string, fallbackDate: string) {
  const fallback = new Date(fallbackDate);

  if (!Number.isNaN(fallback.getTime()) && getMonthKey(fallback) === month) {
    return getDateKey(fallback);
  }

  return `${month}-01`;
}

function formatHours(hours: number) {
  return `${hours.toFixed(1)} hr${hours === 1 ? "" : "s"}`;
}

export default function StudyCalendar({
  initialData,
  fallbackDate,
}: {
  initialData: StudyCalendarData;
  fallbackDate: string;
}) {
  const [monthCursor, setMonthCursor] = useState(() =>
    getInitialMonth(initialData.month, fallbackDate)
  );
  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    getInitialDateKey(initialData.month, fallbackDate)
  );
  const [points, setPoints] = useState(initialData.points);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const cachedMonths = useRef(
    new Map<string, StudyCalendarData["points"]>([
      [initialData.month, initialData.points],
    ])
  );
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      activeRequest.current?.abort();
    },
    []
  );

  const summariesByDate = useMemo(
    () =>
      points.reduce<Record<string, DaySummary>>((summaries, point) => {
        const date = new Date(`${point.date}T00:00:00`);
        if (Number.isNaN(date.getTime())) return summaries;

        const dateKey = point.date;
        summaries[dateKey] ??= {
          date,
          dateKey,
          totalHours: 0,
          subjectTotals: {},
        };
        summaries[dateKey].totalHours += point.hours;
        summaries[dateKey].subjectTotals[point.subject] =
          (summaries[dateKey].subjectTotals[point.subject] || 0) + point.hours;
        return summaries;
      }, {}),
    [points]
  );

  const calendarDays = useMemo(() => {
    const gridStart = new Date(monthCursor);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const dateKey = getDateKey(date);

      return {
        date,
        dateKey,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === monthCursor.getMonth(),
        summary: summariesByDate[dateKey],
      };
    });
  }, [monthCursor, summariesByDate]);

  const selectedSummary = summariesByDate[selectedDateKey];
  const selectedDate = selectedSummary?.date ?? new Date(`${selectedDateKey}T00:00:00`);
  const selectedDayData = Object.entries(selectedSummary?.subjectTotals ?? {})
    .map(([subject, hours]) => ({ subject, hours, color: getSubjectColor(subject) }))
    .sort((a, b) => b.hours - a.hours || a.subject.localeCompare(b.subject));

  function loadMonth(nextMonth: Date, nextSelectedDateKey: string) {
    const month = getMonthKey(nextMonth);
    activeRequest.current?.abort();
    setMonthCursor(nextMonth);
    setSelectedDateKey(nextSelectedDateKey);
    setError("");

    const cached = cachedMonths.current.get(month);
    if (cached) {
      setPoints(cached);
      return;
    }

    const controller = new AbortController();
    activeRequest.current = controller;
    setPoints([]);

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/study-sessions/calendar?month=${encodeURIComponent(month)}`,
          { cache: "no-store", signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to load study calendar.");
        }

        const data = (await response.json()) as StudyCalendarData;
        cachedMonths.current.set(month, data.points);

        if (!controller.signal.aborted) {
          setPoints(data.points);
        }
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === "AbortError") return;
        setError("Unable to load this month. Please try again.");
      } finally {
        if (activeRequest.current === controller) {
          activeRequest.current = null;
        }
      }
    });
  }

  function changeMonth(offset: number) {
    const nextMonth = new Date(
      monthCursor.getFullYear(),
      monthCursor.getMonth() + offset,
      1
    );
    loadMonth(nextMonth, getDateKey(nextMonth));
  }

  function selectDay(date: Date, dateKey: string, isCurrentMonth: boolean) {
    if (isCurrentMonth) {
      setSelectedDateKey(dateKey);
      return;
    }

    loadMonth(getMonthStart(date), dateKey);
  }

  return (
    <section
      aria-busy={isPending}
      className="journal-calendar"
      aria-labelledby="calendar-heading"
    >
      <div className="calendar-heading-row">
        <h2 id="calendar-heading">{monthFormatter.format(monthCursor)}</h2>
        <div className="calendar-navigation">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => changeMonth(-1)}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="calendar-layout">
        <div className="calendar-grid-wrap">
          <div className="calendar-weekdays" aria-hidden="true">
            {dayNames.map((dayName) => (
              <span key={dayName}>{dayName}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarDays.map((day) => {
              const isSelected = day.dateKey === selectedDateKey;
              const totalHours = day.summary?.totalHours ?? 0;
              const subjectMarkers = Object.keys(day.summary?.subjectTotals ?? {})
                .sort((a, b) =>
                  (day.summary?.subjectTotals[b] ?? 0) -
                  (day.summary?.subjectTotals[a] ?? 0)
                )
                .slice(0, 3);

              return (
                <button
                  key={day.dateKey}
                  type="button"
                  aria-label={`${accessibleDateFormatter.format(day.date)}: ${
                    totalHours > 0 ? formatHours(totalHours) : "no study time"
                  }`}
                  aria-pressed={isSelected}
                  className={`calendar-day${isSelected ? " is-selected" : ""}${
                    day.isCurrentMonth ? "" : " is-adjacent"
                  }`}
                  onClick={() => selectDay(day.date, day.dateKey, day.isCurrentMonth)}
                >
                  <span className="calendar-day-number">{day.dayNumber}</span>
                  {totalHours > 0 ? (
                    <span className="calendar-day-study">
                      <span className="calendar-hours">{totalHours.toFixed(1)}h</span>
                      <span className="calendar-markers" aria-hidden="true">
                        {subjectMarkers.map((subject) => (
                          <i
                            key={subject}
                            style={{ backgroundColor: getSubjectColor(subject) }}
                          />
                        ))}
                      </span>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="selected-day-note" aria-live="polite">
          <time dateTime={selectedDateKey}>
            {Number.isNaN(selectedDate.getTime())
              ? selectedDateKey
              : selectedDateFormatter.format(selectedDate)}
          </time>
          <span className="selected-day-rule" aria-hidden="true" />

          {isPending || error ? (
            <p className="selected-day-empty">
              {isPending ? "Loading this month…" : error}
            </p>
          ) : selectedDayData.length > 0 ? (
            <>
              <ul>
                {selectedDayData.map((entry) => (
                  <li key={entry.subject}>
                    <i style={{ backgroundColor: entry.color }} aria-hidden="true" />
                    <span>{entry.subject}</span>
                    <strong>{entry.hours.toFixed(1)} hrs</strong>
                  </li>
                ))}
              </ul>
              <p className="selected-day-total">
                {formatHours(selectedSummary?.totalHours ?? 0)} total
              </p>
            </>
          ) : (
            <p className="selected-day-empty">No studying was logged on this page yet.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
