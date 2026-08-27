// app/actions.ts
"use server";

import { revalidatePath, updateTag } from "next/cache";
import { auth } from "../auth";
import { prisma } from "../lib/prisma";
import { getStudyDataCacheTag } from "../lib/study-cache";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function getCurrentUserIdOrThrow() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Not authorized");
  }

  return userId;
}

export async function addStudySession(formData: FormData) {
  const userId = await getCurrentUserIdOrThrow();
  const subject = getFormString(formData, "subject");
  const hoursValue = getFormString(formData, "hours");
  const dateValue = getFormString(formData, "date");
  const hours = Number(hoursValue);

  if (!subject) {
    throw new Error("Subject is required");
  }

  if (subject.length > 80) {
    throw new Error("Subject must be 80 characters or fewer");
  }

  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
    throw new Error("Hours must be a number between 0 and 24");
  }

  const date = dateValue ? new Date(dateValue) : new Date();

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid study date");
  }

  await prisma.studySession.create({
    data: {
      subject,
      hours,
      date,
      userId,
    },
  });

  updateTag(getStudyDataCacheTag(userId));
  revalidatePath("/dashboard");
}

export async function deleteSession(id: string) {
  const userId = await getCurrentUserIdOrThrow();
  const sessionId = id.trim();

  if (!sessionId) {
    throw new Error("Study session id is required");
  }

  const { count } = await prisma.studySession.deleteMany({
    where: {
      id: sessionId,
      userId,
    },
  });

  if (count === 0) {
    throw new Error("Study session not found");
  }

  updateTag(getStudyDataCacheTag(userId));
  revalidatePath("/dashboard");
  revalidatePath("/remove-hours");
}
