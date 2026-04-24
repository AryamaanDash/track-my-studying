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

const COLORS = ["#10b981", "#f59e0b", "#0ea5e9", "#ef4444", "#14b8a6"];
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

  const pieData = Object.entries(subjectTotals).map(([name, value]) => ({
    name,
    value,
  }));

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
      <div className="flex gap-2 bg-neutral-900 p-1 rounded-lg w-fit">
        {["week", "month", "year", "all"].map((timeframeOption) => (
          <button
            key={timeframeOption}
            onClick={() =>
              setTimeframe(timeframeOption as "week" | "month" | "year" | "all")
            }
            className={`px-4 py-1 rounded-md text-sm capitalize transition-colors ${
              timeframe === timeframeOption
                ? "bg-neutral-700 text-neutral-50"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {timeframeOption}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 h-[350px]">
          <h3 className="text-neutral-400 mb-4 text-sm uppercase tracking-wider">Hours Studied</h3>
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="label" stroke="#525252" fontSize={12} />
                <YAxis stroke="#525252" fontSize={12} />
                <Tooltip
                  cursor={{ fill: "#262626" }}
                  contentStyle={{
                    backgroundColor: "#171717",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value) => [`${Number(value).toFixed(1)} hrs`, "Hours"]}
                />
                <Bar dataKey="hours" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-500">
              No study sessions match this timeframe yet.
            </div>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 h-[350px]">
          <h3 className="text-neutral-400 mb-4 text-sm uppercase tracking-wider">Subject Distribution</h3>
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
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value) => [`${Number(value).toFixed(1)} hrs`, "Hours"]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-500">
              Add a study session to generate your charts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
