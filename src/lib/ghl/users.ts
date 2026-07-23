import { ghlFetch, ghlLocationId } from "./client";

export interface GhlUser {
  id: string;
  name: string;
}

interface UsersResponse {
  users: Array<{ id: string; name: string; firstName?: string; lastName?: string }>;
}

/** Resolves opportunity `assignedTo` ids to rep names, keyed by user id. */
export async function getUsers(): Promise<Map<string, GhlUser>> {
  const { users } = await ghlFetch<UsersResponse>("/users/", {
    locationId: ghlLocationId(),
  });

  return new Map(
    users.map((u) => [
      u.id,
      { id: u.id, name: u.name || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() },
    ]),
  );
}
