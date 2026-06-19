# ShiftBrief Live

**Multiple worker voice updates. One clean team handover.**

ShiftBrief Live helps small teams turn scattered worker shift updates into one
clear handover. The cashier knows a customer complained, the kitchen knows stock
is low, the supervisor knows equipment needs checking — usually spoken quickly,
forgotten, or scattered across devices.

ShiftBrief Live creates a shared **shift room**. Workers join from any phone,
tablet, or laptop and submit a short update (typed, pasted, or spoken). The app
merges everything into:

- a shift summary
- tasks (with priority + owner)
- issues + risk level
- missing information
- a next-shift checklist
- a chat-ready follow-up message

```
scattered worker updates → structured handover → trackable tasks
```

## Flow

1. **Create** (`/`) — manager creates a shift room and gets a short code + join link.
2. **Join** (`/join`, `/join/[code]`) — a worker enters name + role and submits an update.
3. **Briefs** (`/briefs`, `/briefs/[code]`) — manager dashboard polls for updates (every 4s + manual refresh) and clicks **Generate Combined Brief**.
4. **Tasks** (`/tasks`, `/tasks/[code]`) — extracted tasks with To Do / In Progress / Done.

Try it instantly: on the Create page click **Demo Room** to load the Evening
Café Shift with five worker updates, then generate the brief.

## Tech

- Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4
- Route Handlers for the API (no separate backend)
- Storage: in-memory by default; **Supabase** (REST) when configured
- AI: server-only call to an OpenAI-compatible (LiteLLM) endpoint, with an
  offline keyword **fallback parser** when AI is unavailable

## Getting started

```bash
npm install
cp .env.example .env   # fill in values (all AI/Supabase vars are optional)
npm run dev            # http://localhost:3000
```

For testing across real devices on your LAN (phones/tablets):

```bash
npm run dev:lan        # HTTPS on 0.0.0.0 — open the Network URL on each device
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run format`.

## Configuration

All of these are **optional** and **server-only** (never prefix with `NEXT_PUBLIC_`).

### AI (LiteLLM / OpenAI-compatible)

```env
AI_BASE_URL=https://your-endpoint/v1
AI_API_KEY=sk-...
AI_MODEL=claude-sonnet-4-6
```

If any are missing — or the endpoint errors (timeout, auth, **budget exceeded**) —
the app automatically falls back to the offline keyword parser and labels the
brief `Offline` with a warning. The product is fully usable without AI.

> Check status any time: `GET /api/ai/health`.

### Storage: Supabase (optional, for durable / multi-instance hosting)

By default storage is in-memory: it is shared across all devices hitting the
same server (great for `npm run dev:lan` demos) but does **not** survive restarts
or scale across serverless instances. To make it durable, set:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

and run this SQL in the Supabase SQL editor:

```sql
create extension if not exists pgcrypto;

create table if not exists shift_rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  team_type text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table shift_rooms
  add column if not exists admin_pin_hash text;

create table if not exists worker_updates (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references shift_rooms(id) on delete cascade,
  worker_name text not null,
  role text not null,
  transcript text not null,
  audio_data_url text null,
  source text not null default 'paste',
  created_at timestamptz not null default now()
);

alter table worker_updates
  add column if not exists audio_data_url text;

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
  owner text null,
  status text not null default 'todo',
  reason text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shift_rooms_code on shift_rooms(code);
create index if not exists idx_worker_updates_shift_id on worker_updates(shift_id);
create index if not exists idx_combined_briefs_shift_id on combined_briefs(shift_id);
create index if not exists idx_shift_tasks_shift_id on shift_tasks(shift_id);
```

The app switches backends automatically based on env — no code changes needed.

## API

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/shifts` | Create a room (`{title, teamType}`) or seed the demo (`{demo:true}`) |
| GET | `/api/shifts/[code]` | Room + updates + latest brief + tasks |
| POST | `/api/shifts/[code]/updates` | Submit a worker update |
| POST | `/api/shifts/[code]/analyze` | Generate the combined brief (AI → fallback) |
| PATCH | `/api/tasks/[id]` | Update a task's status |
| GET | `/api/ai/health` | AI + storage configuration status |

## Notes

- No auth, payments, WhatsApp, calendar, or raw-audio storage — scope is kept to
  room → updates → combined brief → tasks.
- Speech recording uses the browser's SpeechRecognition as an enhancement; the
  transcript textarea is always primary and audio is never uploaded or stored.
- Build state and decisions live in [`.ai/SHIFTBRIEF_TODO.md`](.ai/SHIFTBRIEF_TODO.md).
