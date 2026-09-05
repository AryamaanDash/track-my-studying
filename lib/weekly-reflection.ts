export function reflectionWeek(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Choose a valid date.");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Choose a valid date.");
  }
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return date.toISOString().slice(0, 10);
}

export function reflectionWeekLabel(week: string): string {
  const start = new Date(`${week}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export function parseReflection(formData: FormData) {
  const get = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const weekStart = new Date(`${reflectionWeek(get("week"))}T00:00:00.000Z`);
  const worked = get("worked");
  const difficult = get("difficult");
  const priorities = get("priorities");
  if ([worked, difficult, priorities].some((entry) => entry.length > 10000)) {
    throw new Error("Keep each entry to 10,000 characters or fewer.");
  }
  if (![worked, difficult, priorities].some(Boolean)) {
    throw new Error("Write in at least one entry before saving.");
  }
  return { weekStart, worked, difficult, priorities };
}
