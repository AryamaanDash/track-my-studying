"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseReflection } from "@/lib/weekly-reflection";
import { revalidatePath } from "next/cache";
import { monitorOperation } from "@/lib/monitor-operation";
import { reportError } from "@/lib/monitoring.ts";
import { checkRateLimit } from "@/lib/rate-limit";

async function saveWeeklyReflectionImpl(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Please sign in again to save your reflection." };
  const limit = await checkRateLimit("write", userId);
  if (!limit.allowed) return { error: limit.error };

  let data;
  try {
    data = parseReflection(formData);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Check your entries and try again." };
  }

  try {
    await prisma.weeklyReflection.upsert({
      where: { userId_weekStart: { userId, weekStart: data.weekStart } },
      create: { ...data, userId },
      update: data,
    });
  } catch (error) {
    reportError(error);
    return { error: "Your reflection could not be saved. Your writing is still here; please try again." };
  }
  revalidatePath("/weekly-reflection");
  return { success: true };
}

export async function saveWeeklyReflection(formData: FormData) {
  return monitorOperation("reflection.save", () => saveWeeklyReflectionImpl(formData));
}
