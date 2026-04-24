// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import { prisma } from "../lib/prisma";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function getCurrentUserOrThrow() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    throw new Error("Not authorized");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function addStudySession(formData: FormData) {
  const user = await getCurrentUserOrThrow();
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
      userId: user.id,
    },
  });

  revalidatePath("/");
}

export async function deleteSession(id: string) {
  const user = await getCurrentUserOrThrow();
  const sessionId = id.trim();

  if (!sessionId) {
    throw new Error("Study session id is required");
  }

  const { count } = await prisma.studySession.deleteMany({
    where: {
      id: sessionId,
      userId: user.id,
    },
  });

  if (count === 0) {
    throw new Error("Study session not found");
  }

  revalidatePath("/");
}
