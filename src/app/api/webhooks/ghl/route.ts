import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireEnv } from "@/lib/env";
import { timingSafeStringEqual } from "@/lib/security";
import { recordStageChange } from "@/lib/db/stageEvents";
import { recordTouchpoint } from "@/lib/db/touchpointEvents";

// This is OUR contract, not GHL's -- the JSON body shape here is what we
// template the GHL Workflow's "Webhook" action to send (see task: Configure
// GHL Workflows). Keeping it self-defined means we don't have to guess at
// an externally-imposed payload shape.
interface StageChangedPayload {
  type: "stage_changed";
  eventId: string;
  contactId: string;
  ownerId?: string | null;
  fromStageId?: string | null;
  toStageId: string;
  product?: string | null;
  occurredAt: string;
}

interface TouchpointPayload {
  type: "touchpoint";
  eventId: string;
  contactId: string;
  eventType: string;
  source?: Record<string, unknown> | null;
  occurredAt: string;
}

type WebhookPayload = StageChangedPayload | TouchpointPayload;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function validate(
  body: unknown,
): { ok: true; payload: WebhookPayload } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const b = body as Record<string, unknown>;

  if (!isNonEmptyString(b.eventId)) return { ok: false, error: "Missing eventId" };
  if (!isNonEmptyString(b.contactId)) return { ok: false, error: "Missing contactId" };
  if (!isNonEmptyString(b.occurredAt)) return { ok: false, error: "Missing occurredAt" };

  if (b.type === "stage_changed") {
    if (!isNonEmptyString(b.toStageId)) return { ok: false, error: "Missing toStageId" };
    return {
      ok: true,
      payload: {
        type: "stage_changed",
        eventId: b.eventId,
        contactId: b.contactId,
        ownerId: typeof b.ownerId === "string" ? b.ownerId : null,
        fromStageId: typeof b.fromStageId === "string" ? b.fromStageId : null,
        toStageId: b.toStageId,
        product: typeof b.product === "string" ? b.product : null,
        occurredAt: b.occurredAt,
      },
    };
  }

  if (b.type === "touchpoint") {
    if (!isNonEmptyString(b.eventType)) return { ok: false, error: "Missing eventType" };
    return {
      ok: true,
      payload: {
        type: "touchpoint",
        eventId: b.eventId,
        contactId: b.contactId,
        eventType: b.eventType,
        source:
          typeof b.source === "object" && b.source !== null
            ? (b.source as Record<string, unknown>)
            : null,
        occurredAt: b.occurredAt,
      },
    };
  }

  return { ok: false, error: `Unknown "type": ${JSON.stringify(b.type)}` };
}

export async function POST(request: NextRequest) {
  const providedSecret = request.headers.get("x-webhook-secret") ?? "";
  if (!timingSafeStringEqual(providedSecret, requireEnv("GHL_WEBHOOK_SECRET"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  // TEMPORARY: log the raw payload so we can see exactly what GHL's
  // Workflow "Webhook" action actually sends (its "standard data" + our
  // custom fields), instead of guessing. Remove once confirmed.
  console.log("GHL webhook raw body:", JSON.stringify(body));

  const result = validate(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { payload } = result;
  const { inserted } =
    payload.type === "stage_changed"
      ? await recordStageChange(payload)
      : await recordTouchpoint(payload);

  return NextResponse.json({ ok: true, inserted });
}
