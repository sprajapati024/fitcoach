
# FitCoach — Full Scaffold Prompt (for Claude Code)
**Deliverable:** Generate a production-ready, mobile-first PWA repo for a black‑&‑white fitness coaching app with AI planning + deterministic progression. Output *all* source files, migrations, and a README. Follow this spec exactly. No placeholders, no TODOs left unresolved unless explicitly marked.

---

## 0) Mission & Constraints
- **Mission:** Personal fitness web app (mostly mobile) for two users initially, installable as a PWA. Users complete onboarding → AI designs plan structure (micro‑cycles), app expands to calendar, user logs sets, **app** computes weekly load targets. PCOS guardrails enforced.
- **Non‑goals (V0):** No nutrition, no chat, no camera form checks, no notifications, no social.
- **Monochrome UI:** Black/white only (grayscale tokens). Dark by default; Optional light theme toggle in Settings.
- **AI role:** Structure & coaching (micro‑cycles, substitutions, brief cues, weekly review). **Never outputs loads/weights.**
- **App role:** Numbers & safety (progression math, caps, deloads, PCOS enforcement, duration budget, RLS).
- **Coach defaults:** **ON by default** (Today Coach, Post‑Debrief, Weekly Review). User can toggle OFF.
- **Scalability:** Token‑lean schemas, compressed JSON, strict Zod validation, one retry on invalid output.

---

## 1) Tech Stack
- **Framework:** Next.js (App Router, TypeScript) + Tailwind + shadcn/ui
- **Hosting:** Vercel (PWA, edge-cache for static, serverless for API routes)
- **Auth & DB:** Supabase Auth (Google) + Supabase Postgres
- **ORM:** Drizzle ORM + drizzle‑kit migrations
- **AI SDK:** OpenAI official SDK
- **State / Utils:** Zod, date‑fns, idb (IndexedDB)
- **PWA:** `next-pwa` (service worker), `manifest.webmanifest`
- **Icons:** lucide-react (outline only)

### Environment Variables (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_NAME=FitCoach
OPENAI_MODEL_PLANNER=o4-mini            # structure planning (micro-cycles)
OPENAI_MODEL_COACH=o4-mini              # today coach / debrief / weekly review
AI_COACH_DEFAULT=on                     # on|off
```

---

## 2) PWA & Theming
- Add `public/manifest.webmanifest` with `display:"standalone"`, `start_url:"/"`, monochrome icons.
- Integrate `next-pwa` with:
  - **Cache-first** app shell (static assets).
  - **Network-first** for `/api/*` and DB-driven pages.
  - **Background sync** for queued logs via IndexedDB when offline.
- Global CSS variables with **dark** (default) and **light** themes via `[data-theme]` attribute.

### Global CSS Tokens
```css
:root[data-theme="dark"]{
  --bg-0:#000; --bg-1:#0a0a0a; --bg-2:#121212;
  --fg-0:#fff; --fg-1:#c7c7c7; --fg-2:#8a8a8a;
  --line-1:#2a2a2a; --line-2:#3a3a3a; --radius:12px;
}
:root[data-theme="light"]{
  --bg-0:#fff; --bg-1:#fafafa; --bg-2:#f5f5f5;
  --fg-0:#000; --fg-1:#303030; --fg-2:#6a6a6a;
  --line-1:#dcdcdc; --line-2:#e7e7e7; --radius:12px;
}
html,body{background:var(--bg-0);color:var(--fg-0);}
```
Tailwind mapping in `tailwind.config.ts`:
```ts
extend:{
  colors:{bg0:"var(--bg-0)",bg1:"var(--bg-1)",bg2:"var(--bg-2)",fg0:"var(--fg-0)",fg1:"var(--fg-1)",fg2:"var(--fg-2)",line1:"var(--line-1)",line2:"var(--line-2)"},
  borderRadius:{DEFAULT:"var(--radius)"}
}
```

---

## 3) App Routes & Pages
```
/app
  /(public)/page.tsx                    # Landing: CTA "Continue with Google"
  /(auth)/dashboard/page.tsx            # Today (pre-brief, exercises, conditioning)
  /(auth)/onboarding/page.tsx           # Stepper (5–7 steps)
  /(auth)/plan/page.tsx                 # Calendar grid; pick/change start date
  /(auth)/workout/[id]/page.tsx         # One-exercise focus logger
  /(auth)/progress/page.tsx             # Tables + minimal sparkline
  /(auth)/settings/page.tsx             # Units, theme, coach toggles, goal bias, sign out
  /api/plan/generate/route.ts           # POST: AI planner
  /api/plan/activate/route.ts           # POST: start_date, active flag
  /api/log/route.ts                     # POST: log sets (batch-friendly)
  /api/progression/compute/route.ts     # POST: recompute next-week targets (admin/test)
/components
  BottomNav.tsx Card.tsx PrimaryButton.tsx Segmented.tsx Stepper.tsx
  ExerciseCard.tsx LoggerRow.tsx PlanWeekGrid.tsx Sparkline.tsx
/lib
  supabaseClient.ts db.ts tz.ts offlineQueue.ts
  ai/prompts.ts ai/buildPrompt.ts ai/postProcessor.ts
  validation.ts progression.ts exerciseLibrary.ts ids.ts
/drizzle
  schema.ts migrations/*
/public/manifest.webmanifest
/styles/globals.css
/scripts/seed.ts
README.md
```

---

## 4) Monochrome UI Specs
- **Bottom nav** with labels (no colors). Tabs: Today · Plan · Progress · Settings.
- **One-exercise focus** on `/workout/[id]`: only one exercise visible while logging; swipe/tap to next.
- **Buttons:** Primary = filled (bg `--fg-0` / text `--bg-0`), Secondary = outline (1px `--line-1`).
- **Inputs:** 48px height, bg `--bg-2`, border `--line-1`. Focus ring 1px white. Error = dashed border + inline “Error: …” text (no red).
- **Cards:** bg `--bg-1`, border `--line-1`, radius `--radius`, subtle light shadow.
- **Typography:** system-ui/Inter; H1 24px, H2 20px, Body 16px, Small 14px, Micro 12px. Head 700, Body 400.
- **Sparklines:** 1px white stroke SVG; show only with ≥2 points.
- **Motion:** 140ms; button active scale .98; “Saved” check animates in.

---

## 5) Data Model (Drizzle) + RLS
`/drizzle/schema.ts`
```ts
import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, pgEnum, date, numeric } from "drizzle-orm/pg-core";

export const sexEnum = pgEnum("sex", ["male","female","other"]);
export const expEnum = pgEnum("experience", ["beginner","intermediate"]);
export const focusEnum = pgEnum("focus", ["upper","lower","full","push","pull","legs","cardio","recovery"]);
export const goalEnum = pgEnum("goal_bias", ["balanced","strength","hypertrophy","fat_loss"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at",{withTimezone:true}).defaultNow()
});

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id),
  name: text("name"),
  sex: sexEnum("sex").notNull(),
  age: integer("age").notNull(),
  heightCm: integer("height_cm").notNull(),
  weightKg: numeric("weight_kg",{precision:6,scale:2}).notNull(),
  units: jsonb("units").$type<{mass:"kg"|"lb";height:"cm"|"ftin"}>().notNull(),
  pcos: boolean("pcos").default(false),
  experience: expEnum("experience").notNull(),
  daysPerWeek: integer("days_per_week").notNull(),           // 3..6
  minutesPerSession: integer("minutes_per_session").notNull(),// 40..90
  weeks: integer("weeks").notNull(),                          // 6..16
  preferredDays: jsonb("preferred_days").$type<string[]>().default([]),
  goalBias: goalEnum("goal_bias").notNull().default("balanced"),
  equipment: jsonb("equipment").$type<{gym:true;available:string[]}>().notNull(),
  constraints: jsonb("constraints").$type<{avoid?:string[];no_high_impact?:boolean}>().default({}),
  createdAt: timestamp("created_at",{withTimezone:true}).defaultNow(),
  updatedAt: timestamp("updated_at",{withTimezone:true}).defaultNow()
});

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  active: boolean("active").notNull().default(false),
  startDate: date("start_date"),
  weeks: integer("weeks").notNull(),
  source: text("source").notNull().default("ai"),
  version: integer("version").notNull().default(1),
  promptSnapshot: jsonb("prompt_snapshot"),
  modelMeta: jsonb("model_meta"),
  createdAt: timestamp("created_at",{withTimezone:true}).defaultNow()
});

export const workouts = pgTable("workouts", {
  id: uuid("id").primaryKey(),
  planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete:"cascade" }),
  week: integer("week").notNull(),
  day: integer("day").notNull(),
  focus: focusEnum("focus").notNull(),
  blocks: jsonb("blocks").notNull() // blocks: warmup|strength[]|conditioning|notes
});

export const logs = pgTable("logs", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete:"cascade" }),
  workoutId: uuid("workout_id").notNull().references(() => workouts.id, { onDelete:"cascade" }),
  performedAt: timestamp("performed_at",{withTimezone:true}).notNull().defaultNow(),
  entries: jsonb("entries").notNull(), // [{exercise,set,reps,weight,notes?}]
  rpeLastSet: integer("rpe_last_set"),
  notes: text("notes"),
  createdAt: timestamp("created_at",{withTimezone:true}).defaultNow()
});

export const aiEvents = pgTable("ai_events", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  planId: uuid("plan_id").references(() => plans.id),
  type: text("type").notNull(), // 'preBrief'|'subAdvice'|'postDebrief'|'weeklyReview'
  inputSnapshot: jsonb("input_snapshot"),
  outputJson: jsonb("output_json"),
  createdAt: timestamp("created_at",{withTimezone:true}).defaultNow()
});
```

### RLS (README must include runnable SQL)
```sql
alter table users enable row level security;
alter table profiles enable row level security;
alter table plans enable row level security;
alter table workouts enable row level security;
alter table logs enable row level security;
alter table ai_events enable row level security;

create policy "self users" on users
  for select using ( id = auth.uid() );
create policy "self profiles" on profiles
  for all using ( user_id = auth.uid() ) with check ( user_id = auth.uid() );
create policy "self plans" on plans
  for all using ( user_id = auth.uid() ) with check ( user_id = auth.uid() );
create policy "self workouts" on workouts
  for all using ( exists(select 1 from plans p where p.id = plan_id and p.user_id = auth.uid()) );
create policy "self logs" on logs
  for all using ( user_id = auth.uid() ) with check ( user_id = auth.uid() );
create policy "self ai_events" on ai_events
  for all using ( user_id = auth.uid() ) with check ( user_id = auth.uid() );
```

---

## 6) Validation Schemas (Zod) `/lib/validation.ts`
```ts
import { z } from "zod";

export const OnboardingSchema = z.object({
  name: z.string().min(1),
  sex: z.enum(["male","female","other"]),
  age: z.number().int().min(14).max(80),
  height_cm: z.number().int().min(120).max(220),
  weight_kg: z.number().min(30).max(250),
  units: z.object({ mass: z.enum(["kg","lb"]), height: z.enum(["cm","ftin"]) }),
  pcos: z.boolean().optional().default(false),
  experience: z.enum(["beginner","intermediate"]),
  schedule: z.object({
    days_per_week: z.number().int().min(3).max(6),
    minutes_per_session: z.number().int().min(40).max(90),
    weeks: z.number().int().min(6).max(16),
    preferred_days: z.array(z.string()).default([])
  }),
  equipment: z.object({ gym: z.literal(true), available: z.array(z.string()) }),
  constraints: z.object({ avoid: z.array(z.string()).optional(), no_high_impact: z.boolean().optional() }).default({}),
  goal_bias: z.enum(["balanced","strength","hypertrophy","fat_loss"]).default("balanced")
});

const progressionPolicy = z.object({
  type: z.literal("rep_range"),
  range: z.string(), // e.g., "8-12"
  sets: z.number().int().min(1).max(6),
  step_kg_upper: z.number().positive(),
  step_kg_lower: z.number().positive(),
  cap_pct: z.number().int().min(5).max(20),
  deload_weeks: z.array(z.number().int())
});

const strengthItem = z.object({
  exercise: z.string(),
  sets: z.number().int().min(1).max(6),
  reps: z.string(), // "8-12"
  rest_s: z.number().int().min(30).max(300),
  tempo: z.string().optional(),
  target_rir: z.string().optional(),
  progression: progressionPolicy
});

const blockWarmup = z.object({ type: z.literal("warmup"), items: z.array(z.string()) });
const blockStrength = z.object({ type: z.literal("strength"), items: z.array(strengthItem).min(1) });
const blockCond = z.object({ type: z.literal("conditioning"), items: z.array(z.object({
  exercise: z.string(),
  duration_min: z.number().int().min(5).max(60),
  intensity: z.string() // "zone2"
}))});
const blockNotes = z.object({ type: z.literal("notes"), items: z.array(z.string()) });

export const DaySchema = z.object({
  day_index: z.number().int().min(1),
  focus: z.enum(["upper","lower","full","push","pull","legs","cardio","recovery"]),
  blocks: z.array(z.discriminatedUnion("type",[blockWarmup,blockStrength,blockCond,blockNotes])).min(2)
});

export const PlanSchema = z.object({
  meta: z.object({
    weeks: z.number().int().min(6).max(16),
    days_per_week: z.number().int().min(3).max(6),
    session_minutes: z.number().int().min(40).max(90),
    pcos_considerations: z.boolean()
  }),
  program: z.object({
    split: z.string(),
    periodization: z.string(), // e.g., "A/B + deload"
    rules: z.object({
      conditioning: z.object({
        zone2_sessions_per_week: z.number().int().min(0).max(4),
        minutes_each: z.number().int().min(10).max(30),
        hiit_allowed: z.boolean()
      })
    })
  }),
  microcycles: z.array(z.object({ name: z.string(), days: z.array(DaySchema) })).min(2).max(3), // A/B/(Deload)
});
```

---

## 7) Exercise Taxonomy & IDs `/lib/exerciseLibrary.ts`, `/lib/ids.ts`
- Provide a curated list per pattern (squat, hinge, horizontal push/pull, vertical push/pull, single‑leg, carry, core), with canonical **IDs** and `aliases: string[]` to de‑dupe logs & trends.
- Example record:
```ts
export const EXERCISES = [
  { id:"bb_bench_press", pattern:"h_push", aliases:["Barbell Bench","BB Bench","Bench Press"], unit:"kg" },
  { id:"db_bench_press", pattern:"h_push", aliases:["Dumbbell Bench"], unit:"kg" },
  { id:"leg_press", pattern:"squat", aliases:["45° Leg Press"], unit:"kg" },
  // ...
];
export function canonicalize(name:string){ /* resolve to id via alias map */ }
```

---

## 8) AI Contracts & Prompts
### Planner — **micro‑cycle template** (no loads)
**Input (normalized):**
```json
{
  "user":{"sex":"female","age":27,"height_cm":160,"weight_kg":81},
  "flags":{"pcos":true,"injuries":[]},
  "experience":"beginner|intermediate",
  "schedule":{"days_per_week":3-6,"minutes_per_session":40-90,"preferred_days":["Mon","Tue"],"weeks":6-16},
  "equipment":{"gym":true,"available":["db","barbell","machines","cables","treadmill","rower"]},
  "goal_bias":"balanced|strength|hypertrophy|fat_loss",
  "constraints":{"avoid":["..."],"no_high_impact":true|false},
  "cardio":{"zone2":true|false,"target_minutes_per_week":60}
}
```
**Output (strict; Zod‑validated):**
- `meta` as above.
- `program`: split, periodization (“A/B + deload” for ≥10w), rules (cardio).
- `microcycles`: **2–3** named cycles (e.g., A, B, Deload) with `days[]` each having `blocks` and **per‑lift progression policy** (`rep_range`, steps, cap, deload weeks).

**System Prompt (put in `/lib/ai/prompts.ts`):**
```
You are FitCoach Planner. Input: a normalized onboarding JSON. Output: a strictly valid Plan Template JSON containing 2–3 micro-cycles (A, B, and optional Deload) for 6–16 weeks and 3–6 days/week. Each training day must include: warmup, 2–5 strength lifts (sets×reps×rest, optional tempo/RIR) with a per-lift progression policy (rep-range rules, step sizes, cap %, deload weeks), optional conditioning (Zone-2), and notes.
NEVER assign weights. If flags.pcos is true: include 2–3× Zone-2 per week, exclude HIIT intervals >60s, and include a recovery note in each day. Fit within minutes_per_session. Output JSON only; no prose.
```

### Today Coach (pre‑brief + cues)
- **Input:** today’s workout (blocks) + last 3 logs.
- **Output:** `{ preBrief: string[<=2 lines], cues: {exerciseId:string, cue:string}[] }` (max one cue per exercise).

### Substitution Advisor
- **Input:** `{ targetExerciseId, reason: "equipment_busy"|"discomfort", availableEquipment: string[] }`
- **Output:** up to **2** same‑pattern alternatives with short rationale; keep sets/reps.

### Post‑Workout Debrief
- **Input:** today’s logs summary (missed sets, high RPE flags).
- **Output:** one paragraph ≤120 chars; reinforcement + 1 micro‑tweak.

### Weekly Coach Review (ON by default; bounded)
- **Input:** week logs + plan.
- **Output:** up to **3** tweaks (add/remove 1 accessory set, move 1 accessory across days, propose 1 same‑pattern swap). No main lift replacements unless user confirms. Return a diff‑friendly JSON.

**All coaching outputs must be terse.**

---

## 9) Post‑Processor `/lib/ai/postProcessor.ts`
- Enforce PCOS rules: ensure **2–3× Zone‑2/week**, remove HIIT >60s, inject daily recovery notes.
- Enforce duration: estimate `(sets × (time per set + rest)) + warmup + conditioning ≤ session_minutes` (trim accessory sets if needed).
- Compress keys (minify strings, strip prose).

---

## 10) Progression Engine `/lib/progression.ts`
- **Inputs:** prior week logs, per‑lift progression policy, units.
- **Algorithm (rep‑range band):**
  - `total_reps = Σ set reps`
  - Increase if `total_reps ≥ sets × upper` **and** `rpe_last_set ≤ 7` → `+step`
  - Hold if within band; Decrease if `< sets × lower` → `-step`
  - Cap ±10% week‑over‑week.
  - Deload weeks (4 & 8 if plan ≥10w): reduce load 10–20% or trim 1 accessory set per pattern.
- **Outputs:** `Map<exerciseId, next_load>` in user units (kg/lb).

- **Unit tests:** increase/hold/decrease, deload, cap, missed week, kg↔lb.

---

## 11) API Routes (contract + semantics)
### `POST /api/plan/generate`
- Auth required. Validate profile (OnboardingSchema). Build planner prompt; call OpenAI; Zod validate PlanSchema. If invalid, retry once with “repair to schema” system message. Run post‑processor. Persist `plans` + expanded `workouts` (from micro‑cycles respecting preferred days & total weeks).

### `POST /api/plan/activate`
- Body: `{ planId, startDate }`. Set `active=true`, write `start_date`, deactivate others for user.

### `POST /api/log`
- Accept single or batch: `{ workoutId, entries:[{exerciseId,set,reps,weight,notes?}], rpe_last_set? }`. Persist `logs`. Queue to IndexedDB offline; background sync when online.

### `POST /api/progression/compute` (admin/test)
- Recompute next‑week targets from logs + policy. Not required for normal flow (we compute on first open of Week k+1).

---

## 12) Start Date & Day Index `/lib/tz.ts`
- Store `start_date` as **UTC date‑only**.
- Compute “Today index” using **user timezone**; handle DST; clamp to plan range.
- Off‑plan days show banner “Off‑plan day” with CTA to Plan.

---

## 13) Offline Logging `/lib/offlineQueue.ts`
- Use `idb` to queue POST bodies to `/api/log` when offline. Background sync registers on regain of connectivity. Show banner “Offline — will sync automatically.”

---

## 14) Onboarding Stepper (5–7 steps)
- Basics: name, sex, age, height, weight, **units**.
- PCOS toggle (if sex=female) + “Not medical advice” banner.
- Experience (beginner/intermediate) – define plainly.
- Schedule: **days/week (3–6)**, **minutes/session (40–90)**, **weeks (6–16)**, preferred days.
- Equipment: gym true; available list.
- Constraints: avoid list; no_high_impact.
- Goal bias slider: Strength ↔ Hypertrophy ↔ Fat‑loss (default Balanced).

---

## 15) UI Flow
- **Landing → Google sign‑in** (Supabase Auth UI).
- **Onboarding** → **Generate Plan** → **Review/Start Date** → **Today**.
- **Today:** pre‑brief banner; cards for warmup, Exercise (LoggerRow), conditioning. Sticky footer: “Save Set” (primary), “Next” (outline). “Skip today” link.
- **Weekly Review (Mon, local):** card with **diff**; max 3 tweaks; Apply requires confirm.
- **Plan:** week grid (3–6 slots per week). Tap to preview.
- **Progress:** adherence %, sets/week, Z2 minutes; tables + sparkline.
- **Settings:** Units, theme (dark/light), Coach toggles (Today, Debrief, Weekly), Tone (Concise/Friendly), Goal bias, Sign out.

---

## 16) Acceptance Criteria (must pass)
1. Onboarding → plan generation completes <10s, plan expands correctly from micro‑cycles to full calendar honoring preferred days.
2. PCOS flag produces 2–3× Zone‑2/wk, no HIIT >60s, recovery notes daily—even if model forgets (post‑processor ensures).
3. Plans support **weeks 6–16**, **days/week 3–6**, **minutes 40–90**.
4. Today renders within time budget; one‑exercise focus logging works with **native numeric keyboard**.
5. Offline logs queue and sync successfully.
6. Weekly loads computed **without AI** via progression engine; deloads at 4 & 8 for ≥10‑week plans (4 only if <10).
7. Coach features **ON by default**, cached per day/week; outputs are short and bounded.
8. RLS policies prevent cross‑user access.
9. Exercise IDs canonicalize aliases; trends aggregate correctly.
10. README documents setup, RLS SQL, migrations, PWA install, and model switches.

---

## 17) Readme Must Include
- Setup steps, env vars, local dev (`pnpm|npm run dev`), drizzle generate/migrate, Supabase RLS SQL.
- PWA notes (Add to Home Screen on iOS/Android).
- Model switches (`OPENAI_MODEL_PLANNER`, `OPENAI_MODEL_COACH`).
- Privacy & disclaimer (“Not medical advice. Health flags are treated as sensitive.”).
- Cost notes: micro‑cycles keep token use tiny; coach outputs are short; budget guardrails in OpenAI billing.

---

## 18) Build Commands & Tooling
- NPM scripts: `dev`, `build`, `start`, `db:generate`, `db:migrate`, `lint`, `typecheck`, `seed`.
- Seed script inserts sample user/profile/plan with static JSON for offline dev.

---

## 19) Anti‑Bloat Rules (enforce)
- JSON‑only AI outputs, **short keys**, no paragraphs. Retry at most once if invalid.
- Deterministic progression only; AI cannot change weights.
- Missed days never auto‑reshuffle; explicit **Skip** required.
- Coach tweaks bounded: max 3/week; only accessory volume or accessory relocation; swaps preserve pattern.
- Store SI in DB; convert at UI; keep a units toggle in Settings.

---

## 20) Final Output Requirements (from you, Claude)
1. **Repo tree** exactly as in section 3.
2. **All code files** filled (not stubs). Server routes implemented, Zod schemas complete, post‑processor complete, progression engine with unit tests.
3. **Drizzle migrations** generated for the schema.
4. **README.md** comprehensive as specified.
5. **Manifest + Service Worker** configured for PWA install and offline log queue.
6. **Theme** wired (dark default, light toggle).
7. **AI calls** wired with caching: Today Coach/Debrief once per day per user; Weekly Review once per week; Substitution only on tap.
8. **Strict lint/types** pass (`tsc`, `eslint`).
9. A successful `npm run dev` should boot the app.

> If any spec is ambiguous, choose the simplest option that preserves: monochrome UX, AI structure + bounded coaching, deterministic progression, PCOS safety, and low token use.
