import { auth } from "@/auth";
import JournalCover from "@/components/JournalCover";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Your Personal Study Journal",
  description:
    "Open a personal study journal for logging focused work, reviewing patterns, and building consistency.",
};

export default async function HomePage() {
  await connection();

  const session = await auth();
  if (session?.user?.email) redirect("/dashboard");

  return <JournalCover />;
}
