# ShiftBrief Live Build State

> Single source of truth for this build. If chat context is lost, read this file
> first, inspect the repo, then continue from **15. Handoff Summary** and
> **11. Current Progress**.

## 1. Product Goal
ShiftBrief Live turns scattered worker voice/text shift updates into one clean
team handover. A manager creates a shared shift room (short code + join link).
Workers join from any device, enter name + role, and paste or speak a short
update. All updates land under the same shift. The manager clicks "Generate
Combined Brief" and AI merges every update into a single handover: summary,
risk level, tasks, issues, missing info, next-shift checklist, and a
chat-ready follow-up message. Tasks become a trackable board. If AI is
unavailable, an offline keyword parser produces the same shaped brief.

## 2. Current Confirmed Scope
**Must-have**
- `.ai/SHIFTBRIEF_TODO.md`, create room, room code/link, join room,
  submit transcript update, manager dashboard, polling + manual refresh,
  AI combined brief, fallback parser, extracted tasks, task status update,
  copy follow-up message, seed demo data.

**Should-have**
- Browser SpeechRecognition, risk badges, AI progress steps, update-feed
  animation, export brief as text, mobile + dark/light polish, dynamic OG.

**Only-if-time-remains**
- QR join, Supabase realtime, task filtering, shareable public brief link.

**Explicitly excluded**
- auth, payments, WhatsApp, calendar, payroll, attendance, full call
  recording, raw audio storage, complex team workspace, advanced permissions.

## 3. Current Repository Facts
- Framework: **Next.js 16.2.9 (App Router)**, React 19.2, TypeScript 5.
  `params` is async (Promise) in pages and route handlers — always `await`.
- Package manager: **npm** (package-lock.json present).
- Styling: **Tailwind CSS 4** + shadcn (radix-lyra style), oklch theme tokens
  in `src/styles/shadcn.css`, glass utility in `src/styles/glass.css`.
  Font is JetBrains Mono (monospace everywhere).
- UI primitives live in `src/components/ui/shadcn/` (only `button.tsx` shipped;
  we added input/textarea/label/badge/card/select).
- Icons: `@phosphor-icons/react`.
- Animation: `motion` (framer motion v12).
- Env validation: `@t3-oss/env-nextjs` + zod in `src/env.ts`.
- Lint/format: **Biome** (`npm run lint`, `npm run format`). 2-space indent.
- Build/dev: `npm run dev`, `npm run dev:lan` (HTTPS on 0.0.0.0 for phones),
  `npm run build`.
- Important dirs: `src/app` (routes + api), `src/components`, `src/lib`,
  `src/hooks`, `src/config`, `src/styles`.

## 4. Implementation Plan (execution order)
1. State file (this file) + env keys + env validation + site config.
2. lib: types, room-code, validation, ai-schema, prompts, ai client,
   fallback-parser, seed-data, format, store (memory + Supabase REST).
3. API route handlers.
4. Hooks (polling, shift-room, speech-recognition).
5. UI primitives + ShiftBrief components.
6. Pages (Create `/`, Join, Briefs, Tasks) + nav + layout cleanup.
7. README + lint + build verification.

## 5. File Checklist
| File | Purpose | Status |
|---|---|---|
| .ai/SHIFTBRIEF_TODO.md | build state | done |
| .env / .env.example | LiteLLM + Supabase keys | done |
| src/env.ts | typed env (LiteLLM/Supabase optional) | done |
| src/config/site.ts | rebrand to ShiftBrief Live | done |
| src/lib/shiftbrief/types.ts | core types | done |
| src/lib/shiftbrief/room-code.ts | code generator | done |
| src/lib/shiftbrief/validation.ts | zod request schemas | done |
| src/lib/shiftbrief/ai-schema.ts | zod AI output schema | done |
| src/lib/shiftbrief/prompts.ts | system + user prompt builders | done |
| src/lib/shiftbrief/ai.ts | server LiteLLM client | done |
| src/lib/shiftbrief/fallback-parser.ts | offline keyword parser | done |
| src/lib/shiftbrief/seed-data.ts | demo café shift | done |
| src/lib/shiftbrief/format.ts | labels + brief-as-text | done |
| src/lib/shiftbrief/store.ts | storage facade (memory/Supabase) | done |
| src/lib/supabase/server.ts | Supabase REST client | done |
| src/app/api/shifts/route.ts | POST create / demo seed | done |
| src/app/api/shifts/[code]/route.ts | GET room bundle | done |
| src/app/api/shifts/[code]/updates/route.ts | POST update | done |
| src/app/api/shifts/[code]/analyze/route.ts | POST analyze | done |
| src/app/api/tasks/[id]/route.ts | PATCH task status | done |
| src/app/api/ai/health/route.ts | GET AI config status | done |
| src/hooks/use-polling.ts | interval poller | done |
| src/hooks/use-shift-room.ts | room data + poll | done |
| src/hooks/use-speech-recognition.ts | speech enhancement | done |
| src/components/ui/shadcn/* | input/textarea/label/badge/card/select | done |
| src/components/shiftbrief/* | feature components | done |
| src/app/page.tsx | Create page | done |
| src/app/join/(page,[code]) | Join flow | done |
| src/app/briefs/(page,[code]) | Manager dashboard | done |
| src/app/tasks/(page,[code]) | Tasks board | done |
| src/components/layouts/nav.tsx | Create/Join/Briefs/Tasks | done |

## 6. Data Model
TypeScript source of truth: `src/lib/shiftbrief/types.ts`.
- **TeamType**: cafe | retail | repair_shop | cleaning | event | warehouse | homestay | other
- **ShiftStatus**: open | analyzing | brief_ready | closed
- **UpdateSource**: speech | paste | seed
- **Priority**: low | medium | high
- **TaskStatus**: todo | in_progress | done
- **RiskLevel**: low | medium | high
- **ShiftRoom**: id, code, title, teamType, status, createdAt, updatedAt
- **WorkerUpdate**: id, shiftId, workerName, role, transcript, source, createdAt
- **ShiftTask**: id, shiftId, title, priority, owner|null, status, reason, timestamps
- **BriefIssue**: title, severity, details, mentionedBy[]
- **MissingInformation**: question, whyNeeded
- **CombinedBriefAIResult**: AI output shape (see ai-schema.ts)
- **CombinedBrief**: stored brief = AI result + tasks[] + ids/timestamps

## 7. API Routes
- **POST /api/shifts** — create room `{title, teamType}` → `{ok,data:ShiftRoom}`.
  Body `{demo:true}` seeds the café demo room (room + 5 worker updates).
- **GET /api/shifts/[code]** — `{ok,data:{room,updates,brief,tasks}}` (404 if no room).
- **POST /api/shifts/[code]/updates** — `{workerName,role,transcript,source?}`
  → `{ok,data:WorkerUpdate}`. Validates lengths.
- **POST /api/shifts/[code]/analyze** — `{forceFallback?}` →
  `{ok,mode:"ai"|"fallback",data:CombinedBrief,warning?}`. Tries AI, falls back.
- **PATCH /api/tasks/[id]** — `{status}` → `{ok,data:ShiftTask}`.
- **GET /api/ai/health** — `{ok,data:{configured,model}}`, no secret leakage.

## 8. Storage Strategy
Facade in `src/lib/shiftbrief/store.ts` picks a backend at module load:
- **Supabase REST** when `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set
  (PostgREST via fetch + service role, server-only; tables in section 9 SQL).
- **In-memory** otherwise (default). Persisted on `globalThis` so it survives
  Next dev HMR. All devices hitting the same server share it — this makes the
  local multi-device LAN demo (`npm run dev:lan`) work with zero setup.
  Note: in-memory does not persist across server restarts or scale across
  serverless instances — set Supabase env for durable/multi-instance hosting.
Demo seed: `POST /api/shifts {demo:true}` (or "Demo Room" button). No raw audio
is ever stored; only transcripts. No localStorage for shared shift data.

## 9. AI Behavior
- Server-only call in `src/lib/shiftbrief/ai.ts` to an OpenAI-compatible
  chat-completions endpoint (LiteLLM). Never called from the client.
- Env: `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`
  (default model `claude-sonnet-4-6`). Keys are server-only, never NEXT_PUBLIC.
- Strict JSON schema validated with zod (`ai-schema.ts`); arrays clamped
  (tasks<=8, issues<=6, missingInfo<=5, checklist<=8). Markdown fences stripped.
- Any error / missing env / invalid JSON → keyword fallback parser, response
  `mode:"fallback"` with a UI warning. AI task status is always `todo`.

## 10. Multi-device Recording Logic
- Workers record/type separately on their own devices.
- They join the same shift room via code or link (`/join/[code]`).
- Each device POSTs its own transcript to `/api/shifts/[code]/updates`.
- Backend stores each update under the same shift id.
- AI merges all updates into one handover on demand.
- No live group-call recording. No audio storage. Recording optional;
  paste/typed transcript is primary, SpeechRecognition is an enhancement.

## 11. Current Progress
- [x] State file
- [x] Env + validation + site config
- [x] lib layer
- [x] API routes
- [x] Hooks
- [x] UI components
- [x] Pages + nav
- [x] README + lint + build
- [ ] Blocked: none

## 12. Decisions Made
- **No Supabase credentials available + failure-test rule** → ship a storage
  facade that works in-memory by default and upgrades to Supabase REST via env.
  This delivers a finished, demoable flow immediately without provisioning.
- **Supabase via raw REST (PostgREST) + fetch**, not `@supabase/supabase-js`,
  to avoid adding a dependency and keep it runtime-agnostic.
- **Model `claude-sonnet-4-6`** by default (cheaper than Opus per key email;
  $25 budget). Configurable via `AI_MODEL`.
- **Native styled `<select>`** for team type (robust, accessible) instead of a
  full radix Select, per "prefer finished demo over infra".
- **Routing**: `/` is the Create page. Removed placeholder `(pages)` group
  (home/browse/search/more) which also fixed a duplicate `/` route conflict.
  Nav is Create / Join / Briefs / Tasks.
- **Floating voice widget on Join (user request).** Built
  `floating-voice-capture.tsx` — reuses the floating glass mic/waveform
  aesthetic of the old `FloatingVoiceRecorder` but drives SpeechRecognition →
  fills the worker's transcript box. No audio is recorded or stored. It renders
  fixed bottom-right (above the mobile nav) only on `/join/[code]`, self-hides
  when speech is unsupported. The inline Record button was removed from
  `transcript-editor.tsx` (now textarea-only). The old audio-only
  `FloatingVoiceRecorder` stays unused/out of the layout.
- Hand-wrote minimal shadcn primitives (input/textarea/label/badge/card/select)
  matching the existing `button.tsx` conventions (offline-safe, no CLI/network).

## 13. Known Issues / Blockers
- **LiteLLM key budget exhausted.** The provided key reports `budget_exceeded`
  (cost 25.14 / max 25.0) → HTTP 429 on every AI call. The AI integration code
  is correct (it authenticates and parses responses); the app automatically uses
  the offline parser and labels briefs `Offline`. To get AI output, top up the
  key budget or point AI_* at an endpoint with budget — no code change.
- In-memory store is not durable across restarts / multiple serverless
  instances. For production multi-device, set Supabase env (SQL in section 9 /
  README) — code switches automatically.
- SpeechRecognition support is inconsistent (Safari/iOS, mixed Malay-English).
  Mitigated: transcript textarea is always primary and editable.

## 14. Commands Run
- `npx biome check src` → clean (74 files, 0 errors/warnings).
- `npm run build` → success (compiled, TypeScript passed, 15 routes, no conflict).
- Runtime smoke test (dev server on :3000):
  - POST /api/shifts {demo:true} → room created, 5 seed updates ✓
  - GET /api/shifts/[code] → bundle correct ✓
  - POST analyze {forceFallback:true} → 8 tasks, risk high, follow-up ✓
  - PATCH /api/tasks/[id] → status updated; invalid status rejected ✓
  - Non-demo create + update; validation + 404 paths correct ✓
  - Real AI analyze → 429 budget_exceeded → graceful fallback (see section 13) ✓
  - All pages (/ /join /briefs /tasks + [code] variants) → HTTP 200 ✓

## 15. Handoff Summary
- **What changed**: Full ShiftBrief Live MVP implemented end to end.
- **Files modified/created**: see section 5 checklist.
- **What works now**: create room → share code → join from any device →
  submit updates → manager dashboard polls + refresh → generate combined brief
  (AI or offline fallback) → tasks board with status updates → copy follow-up.
- **What is pending**: optional Supabase provisioning for durable hosting;
  optional QR / realtime polish.
- **Exact next step**: run `npm run dev` (or `npm run dev:lan` for phones),
  open `/`, click "Demo Room" to see the full flow, then `npm run build`.
- **Commands the user must run**: `npm run dev` (paste LiteLLM keys into `.env`
  to enable AI; without them the offline parser is used automatically).
