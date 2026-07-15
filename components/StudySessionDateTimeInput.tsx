"use client";

import { useState } from "react";

function formatDateTimeLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function StudySessionDateTimeInput() {
  const [dateTime, setDateTime] = useState(() =>
    formatDateTimeLocal(new Date())
  );

  return (
    <input
      name="date"
      type="datetime-local"
      required
      value={dateTime}
      onChange={(event) => setDateTime(event.target.value)}
      step="60"
      suppressHydrationWarning
      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent [color-scheme:var(--input-color-scheme)]"
    />
  );
}
