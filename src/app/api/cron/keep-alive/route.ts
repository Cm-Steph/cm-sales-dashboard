import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireEnv } from "@/lib/env";
import { timingSafeStringEqual } from "@/lib/security";
import { db } from "@/lib/db/client";

// Runs on a schedule (see vercel.json) purely to touch the Supabase free-tier
// database often enough that it never hits the "paused after 7 days of
// inactivity" limit, even if the sales pipeline itself goes quiet for a
// week (holidays, etc). Real webhook traffic already does this most of the
// time -- this is just insurance for the quiet periods.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${requireEnv("CRON_SECRET")}`;
  if (!timingSafeStringEqual(authHeader, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { error } = await db().from("stage_events").select("id").limit(1);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString() });
}
