import { test } from "node:test";
import assert from "node:assert/strict";
import { computeAttendance } from "./computeAttendance";
import type { SafeAppointment } from "../ghl/appointments";
import type { GhlUser } from "../ghl/users";

const users: Map<string, GhlUser> = new Map([["jack", { id: "jack", name: "Jack O'Brien" }]]);

function appt(overrides: Partial<SafeAppointment>): SafeAppointment {
  return {
    contactRef: "hash",
    assignedTo: "jack",
    status: "showed",
    startTime: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

test("computes booked/attended/showRate from resolved appointment statuses", () => {
  const result = computeAttendance(
    [
      appt({ status: "showed" }),
      appt({ status: "showed" }),
      appt({ status: "noshow" }),
      appt({ status: "cancelled" }),
    ],
    users,
  );

  assert.equal(result.totals.booked, 4);
  assert.equal(result.totals.attended, 2);
  assert.equal(result.totals.noShow, 1);
  assert.equal(result.totals.cancelled, 1);
  assert.equal(result.totals.showRate, 0.5);
});

test("excludes still-upcoming 'confirmed' and 'invalid' appointments from every count", () => {
  const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const result = computeAttendance(
    [
      appt({ status: "confirmed", startTime: farFuture }),
      appt({ status: "invalid" }),
      appt({ status: "showed" }),
    ],
    users,
  );

  assert.equal(result.totals.booked, 1, "only the resolved 'showed' appointment counts");
  assert.equal(result.totals.attended, 1);
});

test("flags 'confirmed' appointments whose scheduled time has already passed as unresolved, not booked", () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const result = computeAttendance(
    [
      appt({ status: "confirmed", startTime: yesterday }),
      appt({ status: "confirmed", startTime: tomorrow }),
      appt({ status: "showed" }),
    ],
    users,
  );

  assert.equal(result.unresolvedPastCount, 1, "only the past-due confirmed appointment counts");
  assert.equal(result.totals.booked, 1, "unresolved appointments aren't counted as booked");
});

test("groups by rep, including an explicit unassigned bucket", () => {
  const result = computeAttendance(
    [appt({ assignedTo: "jack", status: "showed" }), appt({ assignedTo: null, status: "noshow" })],
    users,
  );

  assert.equal(result.byRep.length, 2);
  const jack = result.byRep.find((r) => r.ownerId === "jack");
  const unassigned = result.byRep.find((r) => r.ownerId === "unassigned");
  assert.equal(jack?.ownerName, "Jack O'Brien");
  assert.equal(jack?.counts.attended, 1);
  assert.equal(unassigned?.ownerName, "Unassigned");
  assert.equal(unassigned?.counts.noShow, 1);
});

test("handles an empty appointment list without dividing by zero", () => {
  const result = computeAttendance([], users);
  assert.equal(result.totals.booked, 0);
  assert.equal(result.totals.showRate, null);
  assert.equal(result.byRep.length, 0);
});
