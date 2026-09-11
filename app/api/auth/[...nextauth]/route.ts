import { handlers } from "@/auth";
import { monitorOperation } from "@/lib/monitor-operation";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return monitorOperation("auth.route", () => handlers.GET(request));
}

export async function POST(request: NextRequest) {
  return monitorOperation("auth.route", () => handlers.POST(request));
}
