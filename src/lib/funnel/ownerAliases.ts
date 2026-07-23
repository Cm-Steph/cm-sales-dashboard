/**
 * GHL has two separate user records for the same person ("Pete Flynn" and
 * "Peter Flynn") — confirmed with Steph 2026-07-23, merge them into one
 * canonical rep in the dashboard. Deliberately NOT touching unassigned
 * opportunities here: those are left as "Unassigned" on purpose, since the
 * team needs that bucket visible as a to-do (assign themselves to the
 * contact in GHL), not silently hidden or auto-attributed.
 */
interface OwnerAlias {
  aliasIds: string[];
  canonicalId: string;
  canonicalName: string;
}

const ownerAliases: OwnerAlias[] = [
  {
    aliasIds: ["m4TSEnsR5FLCZouKGr6N", "RtmG5uexjMVHlfmFwEdg"],
    canonicalId: "m4TSEnsR5FLCZouKGr6N",
    canonicalName: "Peter Flynn",
  },
];

const aliasToCanonicalId = new Map<string, string>();
const canonicalNames = new Map<string, string>();
for (const alias of ownerAliases) {
  canonicalNames.set(alias.canonicalId, alias.canonicalName);
  for (const id of alias.aliasIds) {
    aliasToCanonicalId.set(id, alias.canonicalId);
  }
}

export function resolveCanonicalOwnerId(rawOwnerId: string): string {
  return aliasToCanonicalId.get(rawOwnerId) ?? rawOwnerId;
}

export function canonicalOwnerNameOverride(canonicalOwnerId: string): string | undefined {
  return canonicalNames.get(canonicalOwnerId);
}
