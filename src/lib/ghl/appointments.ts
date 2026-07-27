import { ghlFetch, ghlLocationId } from "./client";
import { hashContactId } from "../privacy/hashContact";

export type AppointmentStatus = "confirmed" | "showed" | "cancelled" | "noshow" | "invalid";

/**
 * A Strategy Session booking with every customer-identifying field
 * stripped. GHL's raw calendar event embeds the contact's full name
 * directly in `title` (e.g. "Jane Doe Strategy Session with Clinic
 * Mastery") -- that's read once, transiently, to detect it's actually a
 * Strategy Session, and never kept.
 */
export interface SafeAppointment {
  contactRef: string;
  assignedTo: string | null;
  status: AppointmentStatus;
  startTime: string;
}

interface RawCalendar {
  id: string;
  name: string;
}

interface RawEvent {
  id: string;
  contactId: string;
  assignedUserId?: string;
  appointmentStatus: AppointmentStatus;
  startTime: string;
  title: string;
}

// GHL has no single "list all appointments" endpoint -- /calendars/events
// requires a specific calendarId, so every calendar in the location has to
// be scanned individually. A wide, fixed window (rather than the requested
// date range) so this can be cached and reused across preset changes, same
// pattern as fetchAllSalesPipelineOpportunities.
const WINDOW_PAST_MS = 3 * 365 * 24 * 60 * 60 * 1000;
const WINDOW_FUTURE_MS = 30 * 24 * 60 * 60 * 1000;

function sanitize(raw: RawEvent): SafeAppointment {
  return {
    contactRef: hashContactId(raw.contactId),
    assignedTo: raw.assignedUserId ?? null,
    status: raw.appointmentStatus,
    startTime: raw.startTime,
  };
}

/**
 * All Strategy Session appointments location-wide, sanitized. Matched by
 * the event's own title containing "Strategy Session" rather than the
 * calendar's name -- calendar naming is inconsistent (one real SS calendar
 * is just named "Session with Peter Flynn"), but every actual SS booking's
 * title carries that exact phrase regardless of which calendar it's on.
 * "[Internal]"-prefixed calendars (the team booking test sessions against
 * their own calendar, not real prospect calls) are excluded entirely.
 */
export async function fetchAllStrategySessionAppointments(): Promise<SafeAppointment[]> {
  const { calendars } = await ghlFetch<{ calendars: RawCalendar[] }>("/calendars/", {
    locationId: ghlLocationId(),
  });

  const now = Date.now();
  const startTime = now - WINDOW_PAST_MS;
  const endTime = now + WINDOW_FUTURE_MS;

  const results: SafeAppointment[] = [];

  for (const calendar of calendars) {
    if (calendar.name.startsWith("[Internal]")) continue;

    const { events } = await ghlFetch<{ events: RawEvent[] }>("/calendars/events", {
      locationId: ghlLocationId(),
      calendarId: calendar.id,
      startTime,
      endTime,
    });

    for (const raw of events) {
      if (!raw.title?.includes("Strategy Session")) continue;
      results.push(sanitize(raw));
    }
  }

  return results;
}

export function withinAppointmentRange(appointment: SafeAppointment, from: Date, to: Date): boolean {
  const t = new Date(appointment.startTime).getTime();
  return t >= from.getTime() && t <= to.getTime();
}
