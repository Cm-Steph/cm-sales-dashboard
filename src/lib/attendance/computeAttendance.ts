import type { SafeAppointment } from "../ghl/appointments";
import type { GhlUser } from "../ghl/users";
import { canonicalOwnerNameOverride, resolveCanonicalOwnerId } from "../funnel/ownerAliases";
import { isTrackedRep } from "../funnel/trackedReps";

export interface AttendanceCounts {
  /** showed + noShow + cancelled -- bookings with a resolved outcome. Excludes still-upcoming "confirmed" sessions, since those haven't happened yet either way. */
  booked: number;
  attended: number;
  noShow: number;
  cancelled: number;
  /** attended / booked. */
  showRate: number | null;
}

export interface RepAttendanceMetrics {
  ownerId: string;
  ownerName: string;
  counts: AttendanceCounts;
}

export interface AttendanceResult {
  totals: AttendanceCounts;
  byRep: RepAttendanceMetrics[];
  /**
   * Strategy Sessions whose scheduled time has already passed but whose
   * GHL appointment status is still "confirmed" -- i.e. nobody went back
   * and marked whether the contact showed. Not included in any count
   * above (their outcome is genuinely unknown), but surfaced separately
   * since a large number here means the attendance metrics are only
   * covering the fraction of sessions the team actually updated, not
   * every session that happened.
   */
  unresolvedPastCount: number;
}

function rate(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

function toCounts(attended: number, noShow: number, cancelled: number): AttendanceCounts {
  const booked = attended + noShow + cancelled;
  return { booked, attended, noShow, cancelled, showRate: rate(attended, booked) };
}

/** All-zero counts -- useful as a comparison baseline when a rep had no bookings in a period. */
export function emptyAttendanceCounts(): AttendanceCounts {
  return { booked: 0, attended: 0, noShow: 0, cancelled: 0, showRate: null };
}

/**
 * Pure aggregation: sanitized Strategy Session appointments in, per-rep +
 * team attendance counts out. "confirmed" (still upcoming) and "invalid"
 * appointments are excluded from every count -- they haven't resolved to
 * an outcome yet, so including them would understate the show rate.
 */
export function computeAttendance(
  appointments: SafeAppointment[],
  users: Map<string, GhlUser>,
): AttendanceResult {
  const now = Date.now();
  let teamAttended = 0;
  let teamNoShow = 0;
  let teamCancelled = 0;
  let unresolvedPastCount = 0;
  const repAttended = new Map<string, number>();
  const repNoShow = new Map<string, number>();
  const repCancelled = new Map<string, number>();
  const repNames = new Map<string, string>();

  for (const appt of appointments) {
    const ownerId = appt.assignedTo ? resolveCanonicalOwnerId(appt.assignedTo) : "unassigned";
    if (!isTrackedRep(ownerId)) continue;

    if (appt.status !== "showed" && appt.status !== "noshow" && appt.status !== "cancelled") {
      if (appt.status === "confirmed" && new Date(appt.startTime).getTime() < now) {
        unresolvedPastCount++;
      }
      continue;
    }

    if (appt.status === "showed") teamAttended++;
    else if (appt.status === "noshow") teamNoShow++;
    else teamCancelled++;

    if (!repNames.has(ownerId)) {
      repNames.set(
        ownerId,
        ownerId === "unassigned"
          ? "Unassigned"
          : (canonicalOwnerNameOverride(ownerId) ?? users.get(ownerId)?.name ?? ownerId),
      );
      repAttended.set(ownerId, 0);
      repNoShow.set(ownerId, 0);
      repCancelled.set(ownerId, 0);
    }
    if (appt.status === "showed") repAttended.set(ownerId, (repAttended.get(ownerId) ?? 0) + 1);
    else if (appt.status === "noshow") repNoShow.set(ownerId, (repNoShow.get(ownerId) ?? 0) + 1);
    else repCancelled.set(ownerId, (repCancelled.get(ownerId) ?? 0) + 1);
  }

  const byRep: RepAttendanceMetrics[] = Array.from(repNames.entries())
    .map(([ownerId, ownerName]) => ({
      ownerId,
      ownerName,
      counts: toCounts(
        repAttended.get(ownerId) ?? 0,
        repNoShow.get(ownerId) ?? 0,
        repCancelled.get(ownerId) ?? 0,
      ),
    }))
    .sort((a, b) => b.counts.booked - a.counts.booked);

  return {
    totals: toCounts(teamAttended, teamNoShow, teamCancelled),
    byRep,
    unresolvedPastCount,
  };
}
