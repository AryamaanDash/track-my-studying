import { auth } from "@/auth";
import { getCachedStudyChartData } from "@/lib/study-cache";
import { isStudyTimeframe } from "@/lib/study-session-data";

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return Response.json({ error: "Not authorized" }, { status: 401 });
  }

  const timeframe = new URL(request.url).searchParams.get("timeframe");

  if (!isStudyTimeframe(timeframe)) {
    return Response.json({ error: "Invalid timeframe" }, { status: 400 });
  }

  const data = await getCachedStudyChartData(userId, timeframe);
  return Response.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
