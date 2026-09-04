import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getExclusiveUtcDayEnd } from "@/lib/study-date-range";

export const studyTimeframes = ["week", "month", "year", "all"] as const;

export type StudyTimeframe = (typeof studyTimeframes)[number];

export type AggregatedStudyPoint = {
  date: string;
  subject: string;
  hours: number;
  entryCount: number;
};

export type StudyChartData = {
  points: AggregatedStudyPoint[];
  totalHours: number;
  entryCount: number;
};

export type StudyCalendarData = {
  month: string;
  points: AggregatedStudyPoint[];
};

type AggregateStudyRow = {
  date: string;
  subject: string;
  hours: number;
  entryCount: number;
};

const timeframeDays: Record<Exclude<StudyTimeframe, "all">, number> = {
  week: 7,
  month: 30,
  year: 365,
};

export function isStudyTimeframe(value: string | null): value is StudyTimeframe {
  return studyTimeframes.some((timeframe) => timeframe === value);
}

function getTimeframeStart(timeframe: StudyTimeframe, end: Date) {
  if (timeframe === "all") return null;

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - timeframeDays[timeframe]);
  return start;
}

export function getUtcMonthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

export function getMonthRange(month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;

  if (year < 1900 || year > 2200 || monthIndex < 0 || monthIndex > 11) {
    return null;
  }

  return {
    start: new Date(Date.UTC(year, monthIndex, 1)),
    end: new Date(Date.UTC(year, monthIndex + 1, 1)),
  };
}

function summarizeRows(rows: AggregateStudyRow[]): StudyChartData {
  return rows.reduce<StudyChartData>(
    (summary, row) => {
      const point = {
        date: row.date,
        subject: row.subject,
        hours: Number(row.hours),
        entryCount: Number(row.entryCount),
      };

      summary.points.push(point);
      summary.totalHours += point.hours;
      summary.entryCount += point.entryCount;
      return summary;
    },
    { points: [], totalHours: 0, entryCount: 0 }
  );
}

async function getAggregatedStudyPoints({
  userId,
  start,
  end,
}: {
  userId: string;
  start: Date | null;
  end: Date;
}) {
  const startFilter = start
    ? Prisma.sql`AND "date" >= ${start}`
    : Prisma.empty;

  return prisma.$queryRaw<AggregateStudyRow[]>(Prisma.sql`
    SELECT
      to_char(date_trunc('day', "date"), 'YYYY-MM-DD') AS "date",
      "subject",
      SUM("hours")::double precision AS "hours",
      COUNT(*)::integer AS "entryCount"
    FROM "StudySession"
    WHERE "userId" = ${userId}
      ${startFilter}
      AND "date" < ${end}
    GROUP BY 1, 2
    ORDER BY 1 ASC, 2 ASC
  `);
}

export async function getStudyChartData(
  userId: string,
  timeframe: StudyTimeframe,
  referenceDate = new Date()
) {
  const end = getExclusiveUtcDayEnd(referenceDate);
  const rows = await getAggregatedStudyPoints({
    userId,
    start: getTimeframeStart(timeframe, end),
    end,
  });

  return summarizeRows(rows);
}

export async function getStudyCalendarData(userId: string, month: string) {
  const range = getMonthRange(month);
  if (!range) return null;

  const rows = await getAggregatedStudyPoints({
    userId,
    start: range.start,
    end: range.end,
  });

  return {
    month,
    points: summarizeRows(rows).points,
  } satisfies StudyCalendarData;
}
