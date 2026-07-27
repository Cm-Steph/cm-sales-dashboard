import { test } from "node:test";
import assert from "node:assert/strict";
import { percentChange, percentagePointChange } from "./formatDelta";

test("percentChange computes a normal increase and decrease", () => {
  assert.deepEqual(percentChange(30, 20), { label: "+50.0%", direction: "up" });
  assert.deepEqual(percentChange(10, 20), { label: "-50.0%", direction: "down" });
});

test("percentChange treats a zero baseline with new activity as 'New', not Infinity%", () => {
  assert.deepEqual(percentChange(5, 0), { label: "New", direction: "up" });
});

test("percentChange treats zero-to-zero as flat, not New", () => {
  assert.deepEqual(percentChange(0, 0), { label: "—", direction: "flat" });
});

test("percentChange treats a negligible change as flat", () => {
  assert.equal(percentChange(100, 100).direction, "flat");
});

test("percentagePointChange reports point difference, not percent-of-percent", () => {
  // 20% -> 25% is "+5pp", not "+25%"
  assert.deepEqual(percentagePointChange(0.25, 0.2), { label: "+5.0pp", direction: "up" });
});

test("percentagePointChange treats either side being null as unavailable, not zero", () => {
  assert.deepEqual(percentagePointChange(null, 0.2), { label: "—", direction: "flat" });
  assert.deepEqual(percentagePointChange(0.2, null), { label: "—", direction: "flat" });
});
