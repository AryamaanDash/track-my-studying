"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getSubjectColor } from "@/lib/study-colors";
import type {
  StudyChartData,
  StudyTimeframe,
} from "@/lib/study-session-data";

const timeframeOptions: Array<{ value: StudyTimeframe; label: string }> = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "all", label: "All" },
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatHours(hours: number) {
  return `${hours.toFixed(1)} hr${hours === 1 ? "" : "s"}`;
}

const emptyChartData: StudyChartData = {
  points: [],
  totalHours: 0,
  entryCount: 0,
};

type ChartView = {
  timeframe: StudyTimeframe;
  data: StudyChartData | null;
};

export default function StudyCharts({ initialData }: { initialData: StudyChartData }) {
  const [view, setView] = useState<ChartView | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const cachedData = useRef(
    new Map<StudyTimeframe, StudyChartData>([["month", initialData]])
  );
  const activeRequest = useRef<AbortController | null>(null);
  const timeframe = view?.timeframe ?? "month";
  const data = view?.data ?? (view ? emptyChartData : initialData);

  useEffect(
    () => () => {
      activeRequest.current?.abort();
    },
    []
  );

  function changeTimeframe(nextTimeframe: StudyTimeframe) {
    if (nextTimeframe === timeframe && !error) return;

    activeRequest.current?.abort();
    setError("");

    if (nextTimeframe === "month") {
      setView(null);
      return;
    }

    const cached = cachedData.current.get(nextTimeframe);
    if (cached) {
      setView({ timeframe: nextTimeframe, data: cached });
      return;
    }

    const controller = new AbortController();
    activeRequest.current = controller;
    setView({ timeframe: nextTimeframe, data: null });

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/study-sessions/chart?timeframe=${nextTimeframe}`,
          { cache: "no-store", signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to load study analytics.");
        }

        const nextData = (await response.json()) as StudyChartData;
        cachedData.current.set(nextTimeframe, nextData);

        if (!controller.signal.aborted) {
          setView({ timeframe: nextTimeframe, data: nextData });
        }
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === "AbortError") return;
        setError("Unable to load this timeframe. Please try again.");
      } finally {
        if (activeRequest.current === controller) {
          activeRequest.current = null;
        }
      }
    });
  }

  const { subjects, pieData, barData } = useMemo(() => {
    const subjectTotals = data.points.reduce<Record<string, number>>(
      (totals, point) => {
        totals[point.subject] = (totals[point.subject] || 0) + point.hours;
        return totals;
      },
      {}
    );
    const nextSubjects = Object.keys(subjectTotals).sort((a, b) =>
      a.localeCompare(b)
    );
    const nextPieData = nextSubjects.map((name) => ({
      name,
      value: subjectTotals[name],
    }));
    const dateTotals = data.points.reduce<
      Record<
        string,
        { date: string; label: string; [subject: string]: string | number }
      >
    >((totals, point) => {
      const pointDate = new Date(`${point.date}T00:00:00`);
      const dateKey = Number.isNaN(pointDate.getTime())
        ? point.date
        : getDateKey(pointDate);
      const label = Number.isNaN(pointDate.getTime())
        ? point.date
        : dateFormatter.format(pointDate);
      totals[dateKey] ??= { date: dateKey, label };

      const currentHours = totals[dateKey][point.subject];
      totals[dateKey][point.subject] =
        (typeof currentHours === "number" ? currentHours : 0) + point.hours;
      return totals;
    }, {});

    return {
      subjects: nextSubjects,
      pieData: nextPieData,
      barData: Object.values(dateTotals).sort((a, b) =>
        a.date.localeCompare(b.date)
      ),
    };
  }, [data]);

  const filteredTotal = data.totalHours;
  const hasData = data.entryCount > 0;
  const timeframeLabel = timeframeOptions.find((option) => option.value === timeframe)?.label;
  const statusMessage = isPending
    ? `Loading ${timeframeLabel?.toLowerCase()} study data…`
    : error;

  return (
    <section
      aria-busy={isPending}
      aria-labelledby="study-analytics-heading"
      className="study-analytics"
    >
      <h2 id="study-analytics-heading" className="sr-only">
        Study analytics
      </h2>

      <div className="analytics-summary-row">
        <div className="timeframe-tabs" aria-label="Study analytics timeframe" role="group">
          {timeframeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={timeframe === option.value}
              onClick={() => changeTimeframe(option.value)}
              className={timeframe === option.value ? "is-active" : undefined}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="analytics-range-note">
          {statusMessage
            ? statusMessage
            : hasData
            ? `${formatHours(filteredTotal)} across ${data.entryCount} ${
                data.entryCount === 1 ? "entry" : "entries"
              } in this ${timeframeLabel?.toLowerCase()} view`
            : `No entries in this ${timeframeLabel?.toLowerCase()} view`}
        </p>
      </div>

      <div className="analytics-chart-grid">
        <section className="journal-chart" aria-labelledby="hours-chart-title">
          <h3 id="hours-chart-title">Hours Studied</h3>
          {statusMessage ? (
            <div className="journal-chart-empty">{statusMessage}</div>
          ) : hasData ? (
            <>
              <p className="sr-only">
                A stacked bar chart showing {formatHours(filteredTotal)} across {barData.length}{" "}
                study days.
              </p>
              <div className="chart-canvas chart-canvas--bar" aria-hidden="true">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  initialDimension={{ width: 360, height: 220 }}
                >
                  <BarChart data={barData} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
                    <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="2 3" vertical />
                    <XAxis
                      dataKey="label"
                      stroke="var(--chart-axis)"
                      tickLine={false}
                      axisLine={{ stroke: "var(--chart-axis)" }}
                      fontSize={11}
                    />
                    <YAxis
                      stroke="var(--chart-axis)"
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      fontSize={11}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--chart-cursor)" }}
                      contentStyle={{
                        backgroundColor: "var(--chart-tooltip-bg)",
                        border: "1px solid var(--chart-tooltip-border)",
                        borderRadius: "2px",
                        boxShadow: "var(--annotation-shadow)",
                        color: "var(--chart-tooltip-fg)",
                        fontFamily: "var(--font-sans)",
                        fontSize: "12px",
                      }}
                      formatter={(value, name) => [
                        `${Number(value).toFixed(1)} hrs`,
                        String(name),
                      ]}
                    />
                    {subjects.map((subject) => (
                      <Bar
                        key={subject}
                        dataKey={subject}
                        stackId="hours"
                        fill={getSubjectColor(subject)}
                        radius={[1, 1, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ul className="subject-legend" aria-label="Subjects shown in chart">
                {subjects.map((subject) => (
                  <li key={subject}>
                    <span style={{ backgroundColor: getSubjectColor(subject) }} />
                    {subject}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="journal-chart-empty">
              No study sessions match this timeframe yet.
            </div>
          )}
        </section>

        <section
          className="journal-chart journal-chart--distribution"
          aria-labelledby="distribution-title"
        >
          <h3 id="distribution-title">Subject Distribution</h3>
          {statusMessage ? (
            <div className="journal-chart-empty">{statusMessage}</div>
          ) : hasData ? (
            <>
              <div className="chart-canvas chart-canvas--pie" aria-hidden="true">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  initialDimension={{ width: 230, height: 188 }}
                >
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="44%"
                      outerRadius="78%"
                      stroke="var(--paper)"
                      strokeWidth={2}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={getSubjectColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--chart-tooltip-bg)",
                        border: "1px solid var(--chart-tooltip-border)",
                        borderRadius: "2px",
                        boxShadow: "var(--annotation-shadow)",
                        color: "var(--chart-tooltip-fg)",
                        fontFamily: "var(--font-sans)",
                        fontSize: "12px",
                      }}
                      formatter={(value, name) => [
                        `${Number(value).toFixed(1)} hrs`,
                        String(name),
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="distribution-summary">
                {pieData.map((entry) => (
                  <li key={entry.name}>
                    <span className="distribution-name">
                      <i style={{ backgroundColor: getSubjectColor(entry.name) }} />
                      {entry.name}
                    </span>
                    <span>
                      {((entry.value / filteredTotal) * 100).toFixed(0)}% ·{" "}
                      {entry.value.toFixed(1)}h
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="journal-chart-empty">Save an entry to begin your summary.</div>
          )}
        </section>
      </div>
    </section>
  );
}
