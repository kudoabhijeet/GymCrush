# GymCrush — Product Requirements Document

> A power-user gym app. The USP is **deep functionality wrapped in a rich, fast UI/UX**.
> Workout plans, an ergonomic workout logger, and a smart macro/calorie tracker.

- **Owner:** Abhijeet Prasad
- **Last updated:** 2026-07-18
- **Status:** Phase 0 (scaffolding) in progress

---

## 1. Vision & Goals

GymCrush is for people who take training seriously and are frustrated by apps that are
either powerful-but-ugly or pretty-but-shallow. We want both: the fastest logger in the
category, plan authoring that respects periodization, and nutrition targets grounded in
real formulas — all in an interface that feels premium and responsive.

### Success metrics (post-launch)
- **Activation:** % of new users who log ≥1 full workout within 48h.
- **Retention:** D7 / D30 retention; weekly logged-workout rate.
- **Logging speed:** median time to log a set < 3s (the core "functional UI" bet).
- **Depth:** % of active users using ≥2 pillars (plans + logging + macros).

### Non-goals (for now)
- Social feed / following other users.
- In-app coaching marketplace.
- Wearable-first experience (we integrate later, not lead with it).
- Web app (mobile-first; web is a later consideration).

---

## 2. Target User & Personas

- **The Optimizer** — tracks everything, follows a structured program, wants data and control.
- **The Committed Beginner** — new but serious; needs guided plans and calorie targets.
- **The Returning Lifter** — knows what they're doing, wants speed and low friction above all.

---

## 3. Core Pillars

1. **Workout Plans** — create, edit, explore, and follow plans built around goals
   (strength, hypertrophy, fat loss, general fitness).
2. **Workout Logger** — a simple, extremely functional UI to record sets, reps, weight,
   RPE, and rest — following a plan or freestyle.
3. **Macros & Nutrition** — calorie/macro calculator (BMR/TDEE) from body metrics + goals,
   plus daily food logging against targets.

---

## 4. Tech Stack (decided)

| Layer      | Choice |
|------------|--------|
| Monorepo   | pnpm workspace: `app/`, `backend/`, `packages/shared/` |
| App        | Expo SDK 57 (RN 0.86, React 19.2), Expo Router (file-based), TypeScript |
| Styling/UI | NativeWind (Tailwind for RN) + gluestack components; Reanimated for motion |
| State/Data | TanStack Query (server cache) + Zustand (local UI state); MMKV for persistence |
| Backend    | Node + Express, Prisma ORM, PostgreSQL |
| Auth       | JWT access + refresh tokens; bcrypt password hashing |
| Validation | Zod schemas shared between app and backend via `packages/shared` |
| Testing    | Vitest (backend/shared), Jest + RN Testing Library (app) |

---

## 5. Data Model (high level)

```
User ─┬─< WorkoutPlan ─< PlanDay ─< PlanExercise >─ Exercise
      │
      ├─< WorkoutSession ─< LoggedExercise ─< LoggedSet
      │        └─ (optional) planDayId
      │
      ├─ BodyProfile (weight, height, sex, age, activityLevel, goal)
      ├─< BodyMetricLog (bodyweight over time)
      ├─ MacroTarget (calories, protein, carbs, fat)  [derived, editable]
      └─< FoodLog ─< FoodEntry >─ Food
```

- **Exercise** and **Food** are shared reference catalogs (seedable + user-custom entries).
- **WorkoutSession** may reference a `PlanDay` (following a plan) or be freestyle.
- **MacroTarget** is computed from `BodyProfile` but user-overridable.

---

## 6. Calorie / Macro Logic

- **BMR:** Mifflin-St Jeor equation.
- **TDEE:** BMR × activity multiplier (sedentary → very active: 1.2 – 1.9).
- **Goal adjustment:** cut (−15–20%), maintain (0%), lean bulk (+10–15%).
- **Macros:** protein 1.6–2.2 g/kg bodyweight, fat 0.8–1.0 g/kg, remainder from carbs.
- All formulas live in `packages/shared/src/nutrition/` so app and backend agree.

---

## 7. Phases & TODOs

### Phase 0 — Scaffolding & Foundations  ✅ (in progress)
- [x] pnpm monorepo (`app`, `backend`, `packages/shared`)
- [x] PRD authored
- [x] Shared package: Zod schemas + types (auth, workout, nutrition)
- [x] Backend skeleton: Express + Prisma + JWT + Zod, health route
- [x] Expo app skeleton: Expo Router + NativeWind, theme tokens, tab layout
- [ ] `pnpm install` succeeds across the workspace
- [ ] Backend connects to local Postgres; first migration runs
- [ ] App boots in Expo Go / simulator

### Phase 1 — MVP: Plans + Logging (buildable milestone)
**Auth**
- [ ] Register / login / refresh-token endpoints + secure token storage on device
- [ ] Auth screens + protected routing in the app
**Exercise catalog**
- [ ] Seed exercise library (name, muscle group, equipment, category)
- [ ] Exercise search/browse UI + create custom exercise
**Workout plans**
- [ ] CRUD plans → days → exercises (sets/reps/target scheme) API + UI
- [ ] Plan explorer with goal filters; duplicate a plan
**Workout logger**
- [ ] Start session (freestyle or from a plan day)
- [ ] Fast set entry: weight/reps/RPE, quick-repeat previous set, rest timer
- [ ] Session summary + history list
- [ ] Per-exercise history & simple PR tracking

### Phase 2 — Macros & Nutrition
- [ ] Body profile onboarding (weight, height, sex, age, activity, goal)
- [ ] Calorie/macro calculator (BMR/TDEE) with editable targets
- [ ] Food catalog + search; custom foods; quick-add
- [ ] Daily food log with progress rings against targets
- [ ] Bodyweight tracking + trend chart

### Phase 3 — Rich UX & Insights
- [ ] Volume/strength progression charts (per muscle, per lift)
- [ ] Reanimated micro-interactions, haptics, gesture-driven logging
- [ ] Plan calendar / weekly schedule view
- [ ] Home dashboard: next workout, streak, today's macros
- [ ] Dark/light theme polish + accessibility pass

### Phase 4 — Platform & Sync
- [ ] Offline-first caching + background sync (queue mutations)
- [ ] Multi-device sync hardening
- [x] Local notifications: rest-timer-done alert + daily workout reminder (opt-in, `app/src/lib/notifications.ts`)
- [ ] Remote push (server-sent) — needs a push-token table + Expo push credentials; not started
- [ ] Data export (CSV/JSON)
- [ ] Optional wearable / Health / Google Fit integration

### Phase 5 — Launch Readiness
- [ ] E2E tests (Maestro/Detox) for core flows
- [ ] Error tracking (Sentry) + analytics
- [ ] EAS build/submit pipelines (iOS/Android)
- [ ] App store assets, privacy policy, onboarding polish

---

## 8. Open Questions (revisit before each phase)
- Do we want a curated set of pro-authored plans at launch, or user-generated only?
- Food database: license a source (e.g. Open Food Facts) or build our own catalog?
- Barcode scanning for food logging — Phase 2 or Phase 4?
- Monetization model (free / premium tiers) — affects gating decisions.
