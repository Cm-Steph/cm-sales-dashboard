import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireEnv } from "@/lib/env";
import { timingSafeStringEqual } from "@/lib/security";
import { recordStageChange } from "@/lib/db/stageEvents";
import { recordTouchpoint } from "@/lib/db/touchpointEvents";

// This is OUR contract, not GHL's -- the JSON body shape here is what we
// template the GHL Workflow's "Custom webhook" action to send.
//
// GHL's merge-field catalog (confirmed against the live account, 2026-07-24)
// has no execution/event-id field and no reliable timestamp field outside
// of contact/opportunity dates, so eventId and occurredAt are optional here
// -- if omitted, the server derives them (see below) rather than requiring
// GHL to supply something it doesn't have. toStageId is expected to hold a
// stage *name* (e.g. "{{opportunity.stage_name}}"), matching how
// stageMapping.ts and ownerAliases.ts already key off names rather than
// GHL's opaque per-location stage ids.
interface StageChangedPayload {
  type: "stage_changed";
  eventId?: string;
  contactId: string;
  ownerId?: string | null;
  toStageId: string;
  occurredAt?: string;
}

interface TouchpointPayload {
  type: "touchpoint";
  eventId?: string;
  contactId: string;
  eventType: string;
  source?: Record<string, unknown> | null;
  occurredAt?: string;
}

type WebhookPayload = StageChangedPayload | TouchpointPayload;

const UNRESOLVED_MERGE_FIELD_VALUES = new Set(["null", "undefined"]);

function isFilledString(v: unknown): v is string {
  // Confirmed against a real webhook delivery: GHL sends unresolved merge
  // fields as the literal text "null" (not an empty string, not an
  // omitted key), so that has to be treated the same as missing.
  if (typeof v !== "string") return false;
  const trimmed = v.trim();
  return trimmed.length > 0 && !UNRESOLVED_MERGE_FIELD_VALUES.has(trimmed.toLowerCase());
}

function validate(
  body: unknown,
): { ok: true; payload: WebhookPayload } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const b = body as Record<string, unknown>;

  if (!isFilledString(b.contactId)) return { ok: false, error: "Missing contactId" };
  const eventId = isFilledString(b.eventId) ? b.eventId : undefined;
  const occurredAt = isFilledString(b.occurredAt) ? b.occurredAt : undefined;

  if (b.type === "stage_changed") {
    if (!isFilledString(b.toStageId)) return { ok: false, error: "Missing toStageId" };
    return {
      ok: true,
      payload: {
        type: "stage_changed",
        eventId,
        contactId: b.contactId,
        ownerId: isFilledString(b.ownerId) ? b.ownerId : null,
        toStageId: b.toStageId,
        occurredAt,
      },
    };
  }

  if (b.type === "touchpoint") {
    if (!isFilledString(b.eventType)) return { ok: false, error: "Missing eventType" };
    return {
      ok: true,
      payload: {
        type: "touchpoint",
        eventId,
        contactId: b.contactId,
        eventType: b.eventType,
        source:
          typeof b.source === "object" && b.source !== null
            ? (b.source as Record<string, unknown>)
            : null,
        occurredAt,
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
