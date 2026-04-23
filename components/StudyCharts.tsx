// components/StudyCharts.tsx
"use client";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function StudyCharts({ sessions }: { sessions: any[] }) {
  const [timeframe, setTimeframe] = useState("all");

  // 1. Filter data based on selected timeframe
  const filteredSessions = sessions.filter(session => {
    if (timeframe === "all") return true;
    const sessionDate = new Date(session.date);
    const now = new Date();
    const daysDiff = (now.getTime() - sessionDate.getTime()) / (1000 * 3600 * 24);
    
    if (timeframe === "week") return daysDiff <= 7;
    if (timeframe === "month") return daysDiff <= 30;
    if (timeframe === "year") return daysDiff <= 365;
    return true;
  });

  // 2. Aggregate data for the Pie Chart (By Subject)
  const subjectTotals = filteredSessions.reduce((acc, curr) => {
    acc[curr.subject] = (acc[curr.subject] || 0) + curr.hours;
    return acc;
  }, {});
  
  const pieData = Object.keys(subjectTotals).map(key => ({
    name: key,
    value: subjectTotals[key]
  }));

  // 3. Aggregate data for the Bar Chart (By Date)
  const dateTotals = filteredSessions.reduce((acc, curr) => {
    const dateStr = new Date(curr.date).toLocaleDateString();
    acc[dateStr] = (acc[dateStr] || 0) + curr.hours;
    return acc;
  }, {});

  const barData = Object.keys(dateTotals)
    .map(key => ({ date: key, hours: dateTotals[key] }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      {/* Timeframe Controls */}
      <div className="flex gap-2 bg-neutral-900 p-1 rounded-lg w-fit">
        {['week', 'month', 'year', 'all'].map((t) => (
          <button
            key={t}
            onClick={() => setTimeframe(t)}
            className={`px-4 py-1 rounded-md text-sm capitalize transition-colors ${
              timeframe === t ? "bg-neutral-700 text-neutral-50" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Graph */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 h-[350px]">
          <h3 className="text-neutral-400 mb-4 text-sm uppercase tracking-wider">Hours Studied</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="date" stroke="#525252" fontSize={12} />
              <YAxis stroke="#525252" fontSize={12} />
              <Tooltip cursor={{fill: '#262626'}} contentStyle={{backgroundColor: '#171717', border: 'none', borderRadius: '8px', color: '#fff'}} />
              <Bar dataKey="hours" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 h-[350px]">
          <h3 className="text-neutral-400 mb-4 text-sm uppercase tracking-wider">Subject Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{backgroundColor: '#171717', border: 'none', borderRadius: '8px', color: '#fff'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}