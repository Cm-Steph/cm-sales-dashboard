// Hand-written to match supabase/migrations/0001_init.sql. Keep in sync
// manually -- there's no Supabase CLI project link set up to codegen these.

export interface StageEventRow {
  id: string;
  ghl_event_id: string | null;
  contact_ref: string;
  owner_id: string | null;
  from_stage_id: string | null;
  to_stage_id: string;
  product: string | null;
  event_at: string;
  received_at: string;
}

export interface StageEventInsert {
  id?: string;
  ghl_event_id?: string | null;
  contact_ref: string;
  owner_id?: string | null;
  from_stage_id?: string | null;
  to_stage_id: string;
  product?: string | null;
  event_at: string;
  received_at?: string;
}

export interface TouchpointEventRow {
  id: string;
  ghl_event_id: string | null;
  contact_ref: string;
  event_type: string;
  source: Record<string, unknown> | null;
  event_at: string;
  received_at: string;
}

export interface TouchpointEventInsert {
  id?: string;
  ghl_event_id?: string | null;
  contact_ref: string;
  event_type: string;
  source?: Record<string, unknown> | null;
  event_at: string;
  received_at?: string;
}

export interface Database {
  public: {
    Tables: {
      stage_events: {
        Row: StageEventRow;
        Insert: StageEventInsert;
        Update: Partial<StageEventInsert>;
      };
      touchpoint_events: {
        Row: TouchpointEventRow;
        Insert: TouchpointEventInsert;
        Update: Partial<TouchpointEventInsert>;
      };
    };
    // postgrest-js's GenericSchema requires these keys to be present even
    // when empty, or table type resolution silently falls back to never[].
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
