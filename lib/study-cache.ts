import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  getStudyCalendarData,
  getStudyChartData,
  type StudyTimeframe,
} from "@/lib/study-session-data";

export const studySessionPageSize = 50;

const studyCacheLifetime = {
  stale: 5 * 60,
  revalidate: 15 * 60,
  expire: 60 * 60,
} as const;

export function getStudyDataCacheTag(userId: string) {
  return `study-data:${userId}`;
}

function configureStudyDataCache(userId: string) {
  cacheLife(studyCacheLifetime);
  cacheTag(getStudyDataCacheTag(userId));
}

export async function getCachedPreviousStudySession(userId: string) {
  "use cache";

  configureStudyDataCache(userId);
  const previousSession = await prisma.studySession.findFirst({
    where: { userId },
    select: {
      subject: true,
      hours: true,
      date: true,
      journal: true,
    },
    orderBy: [{ date: "desc" }, { id: "desc" }],
  });

  return previousSession
    ? {
        ...previousSession,
        date: previousSession.date.toISOString(),
      }
    : null;
}

export async function getCachedLifetimeStudyHours(userId: string) {
  "use cache";

  configureStudyDataCache(userId);
  const result = await prisma.studySession.aggregate({
    where: { userId },
    _sum: { hours: true },
  });

  return result._sum.hours ?? 0;
}

export async function getCachedStudySessionCount(userId: string) {
  "use cache";

  configureStudyDataCache(userId);
  return prisma.studySession.count({ where: { userId } });
}

export async function getCachedStudySessionPage(
  userId: string,
  cursor: string | null
) {
  "use cache";

  configureStudyDataCache(userId);
  const studySessions = await prisma.studySession.findMany({
    where: { userId },
    select: {
      id: true,
      subject: true,
      hours: true,
      date: true,
    },
    orderBy: [{ date: "asc" }, { id: "asc" }],
    take: studySessionPageSize + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  return studySessions.map((studySession) => ({
    ...studySession,
    date: studySession.date.toISOString(),
  }));
}

export async function getCachedStudyChartData(
  userId: string,
  timeframe: StudyTimeframe
) {
  "use cache";

  configureStudyDataCache(userId);
  return getStudyChartData(userId, timeframe);
}

export async function getCachedStudyCalendarData(
  userId: string,
  month: string
) {
  "use cache";

  configureStudyDataCache(userId);
  return getStudyCalendarData(userId, month);
}
