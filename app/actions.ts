// app/actions.ts
"use server";

import { revalidatePath, updateTag } from "next/cache";
import bcrypt from "bcryptjs";
import { auth, signOut } from "../auth";
import { prisma } from "../lib/prisma";
import { getStudyDataCacheTag } from "../lib/study-cache";
import { checkRateLimit } from "../lib/rate-limit";
import { monitorOperation } from "../lib/monitor-operation";
import { ExpectedOperationError } from "../lib/monitoring.ts";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseStudyDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ExpectedOperationError("Study date must be a calendar day");
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new ExpectedOperationError("Invalid study date");
  }

  return date;
}

function parseStudySessionFormData(formData: FormData) {
  const subject = getFormString(formData, "subject");
  const hoursValue = getFormString(formData, "hours");
  const dateValue = getFormString(formData, "date");
  const journal = getFormString(formData, "journal");
  const hours = Number(hoursValue);

  if (!subject) {
    throw new ExpectedOperationError("Subject is required");
  }

  if (subject.length > 80) {
    throw new ExpectedOperationError("Subject must be 80 characters or fewer");
  }

  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
    throw new ExpectedOperationError("Hours must be a number between 0 and 24");
  }

  if (journal.length > 10000) {
    throw new ExpectedOperationError("Journal must be 10,000 characters or fewer");
  }

  return {
    subject,
    hours,
    date: parseStudyDate(dateValue),
    journal: journal || null,
  };
}

async function getCurrentUserIdOrThrow() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new ExpectedOperationError("Not authorized");
  }

  return userId;
}

async function addStudySessionImpl(formData: FormData) {
  const userId = await getCurrentUserIdOrThrow();
  const limit = await checkRateLimit("write", userId);
  if (!limit.allowed) return { error: limit.error };
  const studySession = parseStudySessionFormData(formData);

  await prisma.studySession.create({
    data: {
      ...studySession,
      userId,
    },
  });

  updateTag(getStudyDataCacheTag(userId));
  revalidatePath("/dashboard");
  return { success: true };
}

async function updateStudySessionImpl(id: string, formData: FormData) {
  const userId = await getCurrentUserIdOrThrow();
  const limit = await checkRateLimit("write", userId);
  if (!limit.allowed) return { error: limit.error };
  const sessionId = id.trim();

  if (!sessionId) {
    throw new ExpectedOperationError("Study session id is required");
  }

  const studySession = parseStudySessionFormData(formData);
  const { count } = await prisma.studySession.updateMany({
    where: {
      id: sessionId,
      userId,
    },
    data: studySession,
  });

  if (count === 0) {
    throw new ExpectedOperationError("Study session not found");
  }

  updateTag(getStudyDataCacheTag(userId));
  revalidatePath("/dashboard");
  revalidatePath("/remove-hours");
  return { success: true };
}

async function deleteSessionImpl(id: string) {
  const userId = await getCurrentUserIdOrThrow();
  const limit = await checkRateLimit("write", userId);
  if (!limit.allowed) return { error: limit.error };
  const sessionId = id.trim();

  if (!sessionId) {
    throw new ExpectedOperationError("Study session id is required");
  }

  const { count } = await prisma.studySession.deleteMany({
    where: {
      id: sessionId,
      userId,
    },
  });

  if (count === 0) {
    throw new ExpectedOperationError("Study session not found");
  }

  updateTag(getStudyDataCacheTag(userId));
  revalidatePath("/dashboard");
  revalidatePath("/remove-hours");
  return { success: true };
}

export type DeleteAccountState = {
  attempt: number;
  error?: string;
};

async function deleteAccountImpl(
  previousState: DeleteAccountState,
  formData: FormData
): Promise<DeleteAccountState> {
  const userId = await getCurrentUserIdOrThrow();
  const fail = (error: string): DeleteAccountState => ({
    attempt: previousState.attempt + 1,
    error,
  });
  const passwordLimit = await checkRateLimit("deleteAccount", userId);
  if (!passwordLimit.allowed) return fail(passwordLimit.error);
  const writeLimit = await checkRateLimit("write", userId);
  if (!writeLimit.allowed) return fail(writeLimit.error);
  const passwordValue = formData.get("password");
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const confirmation = getFormString(formData, "confirmation");
  const acknowledgement = getFormString(formData, "acknowledgement");

  if (confirmation !== "DELETE") {
    return fail("Type DELETE exactly as shown to confirm.");
  }

  if (acknowledgement !== "understood") {
    return fail("Confirm that you understand this action is permanent.");
  }

  if (!password) {
    return fail("Enter your password to continue.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return fail("We could not verify this account. Please sign in again.");
  }

  const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordsMatch) {
    return fail("That password does not match your account.");
  }

  const { count } = await prisma.user.deleteMany({
    where: { id: userId },
  });

  if (count === 0) {
    return fail("This account could not be found. Please sign in again.");
  }

  await signOut({ redirectTo: "/" });

  return { attempt: previousState.attempt + 1 };
}

export async function addStudySession(formData: FormData) {
  return monitorOperation("study.add", () => addStudySessionImpl(formData));
}

export async function updateStudySession(id: string, formData: FormData) {
  return monitorOperation("study.update", () => updateStudySessionImpl(id, formData));
}

export async function deleteSession(id: string) {
  return monitorOperation("study.delete", () => deleteSessionImpl(id));
}

export async function deleteAccount(previousState: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  return monitorOperation("account.delete", () => deleteAccountImpl(previousState, formData));
}
