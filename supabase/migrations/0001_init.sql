-- Phase 2 schema: pipeline stage-change history + customer journey events.
--
-- Deliberately no name/email/phone columns anywhere. contact_ref is a
-- one-way hash of the GHL contactId (see src/lib/privacy/hashContact.ts)
-- -- it lets us group events belonging to the same anonymous lead without
-- ever storing or exposing anything that identifies a real person.

create extension if not exists pgcrypto;

create table if not exists stage_events (
  id uuid primary key default gen_random_uuid(),
  ghl_event_id text unique,          -- for de-duping retried webhook deliveries
  contact_ref text not null,
  owner_id text,
  from_stage_id text,
  to_stage_id text not null,
  product text,
  event_at timestamptz not null,     -- when the stage change actually happened in GHL
  received_at timestamptz not null default now()
);

create index if not exists stage_events_event_at_idx on stage_events (event_at);
create index if not exists stage_events_contact_ref_idx on stage_events (contact_ref);
create index if not exists stage_events_to_stage_id_idx on stage_events (to_stage_id);

create table if not exists touchpoint_events (
  id uuid primary key default gen_random_uuid(),
  ghl_event_id text unique,
  contact_ref text not null,
  event_type text not null,          -- e.g. 'form_submitted', 'appointment_booked', 'stage_changed'
  source jsonb,                      -- utm/channel metadata only, never PII
  event_at timestamptz not null,
  received_at timestamptz not null default now()
);

create index if not exists touchpoint_events_event_at_idx on touchpoint_events (event_at);
create index if not exists touchpoint_events_contact_ref_idx on touchpoint_events (contact_ref);

-- The app only ever talks to Supabase with the secret key (bypasses RLS).
-- Enabling RLS with zero policies means the publishable/anon key -- which
-- this app never uses, but which is public by design -- can't read or
-- write anything here even by accident.
alter table stage_events enable row level security;
alter table touchpoint_events enable row level security;
