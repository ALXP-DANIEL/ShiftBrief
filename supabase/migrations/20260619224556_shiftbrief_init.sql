-- ShiftBrief Live schema. Accessed server-only via the service-role key, which
-- bypasses RLS. RLS is enabled with no policies so the public anon API cannot
-- read or write these tables.

create extension if not exists pgcrypto;

create table if not exists shift_rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  team_type text not null,
  status text not null default 'open',
  admin_pin_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists worker_updates (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references shift_rooms(id) on delete cascade,
  worker_name text not null,
  role text not null,
  transcript text not null,
  audio_data_url text,
  source text not null default 'paste',
  created_at timestamptz not null default now()
);

create table if not exists combined_briefs (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references shift_rooms(id) on delete cascade,
  brief_title text not null,
  summary text not null,
  risk_level text not null,
  follow_up_message text not null,
  ai_result_json jsonb not null,
  confidence numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists shift_tasks (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references shift_rooms(id) on delete cascade,
  title text not null,
  priority text not null default 'medium',
  owner text,
  status text not null default 'todo',
  reason text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shift_rooms_code on shift_rooms (code);
create index if not exists idx_worker_updates_shift_id on worker_updates (shift_id);
create index if not exists idx_combined_briefs_shift_id on combined_briefs (shift_id);
create index if not exists idx_shift_tasks_shift_id on shift_tasks (shift_id);

alter table shift_rooms enable row level security;
alter table worker_updates enable row level security;
alter table combined_briefs enable row level security;
alter table shift_tasks enable row level security;
