import { auth } from "@/auth";
import { getStudyCalendarData } from "@/lib/study-session-data";

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return Response.json({ error: "Not authorized" }, { status: 401 });
  }

  const month = new URL(request.url).searchParams.get("month") ?? "";
  const data = await getStudyCalendarData(userId, month);

  if (!data) {
    return Response.json({ error: "Invalid month" }, { status: 400 });
  }

  return Response.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
