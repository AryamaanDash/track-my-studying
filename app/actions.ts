// app/actions.ts
"use server";

import { auth } from "../auth";
import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";

export async function addStudySession(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Not authorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) throw new Error("User not found");

  const subject = formData.get("subject") as string;
  const hours = parseFloat(formData.get("hours") as string);
  const dateStr = formData.get("date") as string;

  await prisma.studySession.create({
    data: {
      subject,
      hours,
      date: dateStr ? new Date(dateStr) : new Date(),
      userId: user.id,
    },
  });

  // This tells Next.js to immediately refresh the homepage data
  revalidatePath("/");
}

export async function deleteSession(id: string) {
  await prisma.studySession.delete({
    where: { id },
  });
  revalidatePath("/");
}