import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "../env";

let client: ReturnType<typeof createClient> | null = null;

/**
 * Server-only Supabase client using the secret key (bypasses RLS). Never
 * import this from a Client Component or expose the secret key to the
 * browser -- the app has no use for the publishable/anon key at all.
 *
 * Deliberately untyped against a generated Database schema (postgrest-js's
 * generic resolution is fragile to hand-match without codegen from a
 * linked Supabase project). Type safety instead lives at the boundary in
 * stageEvents.ts/touchpointEvents.ts, whose exported functions take fully
 * typed input and are the only callers of db() in the app.
 */
export function db() {
  if (!client) {
    client = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SECRET_KEY"), {
      auth: { persistSession: false },
    });
  }
  return client;
}
