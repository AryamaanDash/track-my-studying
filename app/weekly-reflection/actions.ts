"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseReflection } from "@/lib/weekly-reflection";
import { revalidatePath } from "next/cache";

export async function saveWeeklyReflection(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Please sign in again to save your reflection." };

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
  } catch {
    return { error: "Your reflection could not be saved. Your writing is still here; please try again." };
  }
  revalidatePath("/weekly-reflection");
  return { success: true };
}
