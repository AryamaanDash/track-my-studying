"use client";

import { useState } from "react";

function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function StudySessionDateInput({ id }: { id?: string }) {
  const [date, setDate] = useState(() => formatDateLocal(new Date()));

  return (
    <input
      id={id}
      name="date"
      type="date"
      required
      value={date}
      onChange={(event) => setDate(event.target.value)}
      suppressHydrationWarning
      className="journal-input journal-date-input journal-hand [color-scheme:var(--input-color-scheme)]"
    />
  );
}
