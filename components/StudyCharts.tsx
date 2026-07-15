// components/StudyCharts.tsx
"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type StudyChartSession = {
  id: string;
  subject: string;
  hours: number;
  date: string;
};

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

export default function StudyCharts({ sessions }: { sessions: StudyChartSession[] }) {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year" | "all">("all");
  const [now] = useState(() => Date.now());

  const filteredSessions = sessions.filter((session) => {
    if (timeframe === "all") return true;

    const sessionTime = new Date(session.date).getTime();

    if (Number.isNaN(sessionTime)) return false;

    const daysDiff = (now - sessionTime) / (1000 * 3600 * 24);

    if (timeframe === "week") return daysDiff <= 7;
    if (timeframe === "month") return daysDiff <= 30;
    if (timeframe === "year") return daysDiff <= 365;

    return true;
  });

  const subjectTotals = filteredSessions.reduce<Record<string, number>>((acc, session) => {
    acc[session.subject] = (acc[session.subject] || 0) + session.hours;
    return acc;
  }, {});

  const pieData = Object.entries(subjectTotals)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const dateTotals = filteredSessions.reduce<
    Record<string, { date: string; label: string; hours: number }>
  >((acc, session) => {
    const sessionDate = new Date(session.date);

    if (Number.isNaN(sessionDate.getTime())) {
      return acc;
    }

    const dateKey = getDateKey(sessionDate);

    acc[dateKey] ??= {
      date: dateKey,
      label: dateFormatter.format(sessionDate),
      hours: 0,
    };

    acc[dateKey].hours += session.hours;
    return acc;
  }, {});

  const barData = Object.values(dateTotals).sort((a, b) => a.date.localeCompare(b.date));
  const hasData = filteredSessions.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex w-fit gap-2 rounded-lg border border-border bg-surface p-1">
        {["week", "month", "year", "all"].map((timeframeOption) => (
          <button
            key={timeframeOption}
            onClick={() =>
              setTimeframe(timeframeOption as "week" | "month" | "year" | "all")
            }
            className={`px-4 py-1 rounded-md text-sm capitalize transition-colors ${
              timeframe === timeframeOption
                ? "bg-surface-muted text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {timeframeOption}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-3xl p-6 h-[350px]">
          <h3 className="text-muted mb-4 text-sm uppercase tracking-wider">Hours Studied</h3>
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="label" stroke="var(--chart-axis)" fontSize={12} />
                <YAxis stroke="var(--chart-axis)" fontSize={12} />
                <Tooltip
                  cursor={{ fill: "var(--chart-cursor)" }}
                  contentStyle={{
                    backgroundColor: "var(--chart-tooltip-bg)",
                    border: "1px solid var(--chart-tooltip-border)",
                    borderRadius: "8px",
                    color: "var(--chart-tooltip-fg)",
                  }}
                  formatter={(value) => [`${Number(value).toFixed(1)} hrs`, "Hours"]}
                />
                <Bar dataKey="hours" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              No study sessions match this timeframe yet.
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-3xl p-6 h-[350px]">
          <h3 className="text-muted mb-4 text-sm uppercase tracking-wider">Subject Distribution</h3>
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={{ fill: "var(--muted-strong)", fontSize: 12 }}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={getSubjectColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--chart-tooltip-bg)",
                    border: "1px solid var(--chart-tooltip-border)",
                    borderRadius: "8px",
                    color: "var(--chart-tooltip-fg)",
                  }}
                  formatter={(value, name) => [
                    `${Number(value).toFixed(1)} hrs`,
                    String(name),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              Add a study session to generate your charts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
