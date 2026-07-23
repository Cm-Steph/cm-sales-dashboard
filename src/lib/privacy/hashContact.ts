import { createHash } from "node:crypto";

/**
 * Turns a GHL contactId into an opaque, one-way reference used to group
 * events belonging to the same anonymous lead without ever storing or
 * exposing the reversible GHL id (which is joinable back to a real person
 * inside GHL). Never log or display the raw contactId anywhere downstream
 * of this function.
 */
export function hashContactId(contactId: string): string {
  const salt = process.env.CONTACT_HASH_SALT;
  if (!salt) {
    throw new Error("CONTACT_HASH_SALT is not set");
  }
  return createHash("sha256").update(`${salt}:${contactId}`).digest("hex");
}
