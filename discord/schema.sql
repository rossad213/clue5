-- Dedicated Clue5 Discord project only. Do NOT run against unrelated project databases.
create table if not exists public.clue5_discord_rooms (
  instance_id text primary key check (length(instance_id) between 8 and 128),
  round integer not null default 1 check (round between 1 and 500),
  case_index integer not null default 0,
  clue_count integer not null default 1 check (clue_count between 1 and 5),
  category text not null,
  answer text not null,
  clues jsonb not null,
  aliases jsonb not null default '[]'::jsonb,
  players jsonb not null default '{}'::jsonb,
  host_id text not null,
  ended boolean not null default false,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '3 hours'),
  version integer not null default 0
);
create index if not exists clue5_discord_rooms_expires_at_idx on public.clue5_discord_rooms (expires_at);
alter table public.clue5_discord_rooms enable row level security;
-- No public client access. All requests must pass through the authenticated Discord game API.
revoke all on public.clue5_discord_rooms from anon, authenticated;
-- Grant privileges only to the private server-side service role.
grant select,insert,update,delete on public.clue5_discord_rooms to service_role;
-- Periodically clean up rooms older than 3 hours via a future scheduled job.
