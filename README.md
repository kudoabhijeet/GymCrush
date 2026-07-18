# GymCrush 🏋️

A power-user gym app: **workout plans, a fast workout logger, and a smart macro tracker** — with a rich, responsive UI/UX. See [PRD.md](./PRD.md) for the full product spec, phases, and TODOs.

## Monorepo layout

```
GymCrush/
├── app/                  Expo SDK 57 app (Expo Router + NativeWind)
│   ├── app/              file-based routes
│   │   ├── (auth)/       login / register / forgot-password
│   │   ├── (onboarding)/ goal · body · activity · results
│   │   ├── (tabs)/       Home · Plans · Log · Nutrition · Profile
│   │   ├── plan/         plan detail / new / edit
│   │   ├── workout/      active session · summary
│   │   ├── exercise/     picker · history
│   │   ├── food/         search · custom food
│   │   └── body/         weight tracking
│   └── src/
│       ├── components/ui reusable themed primitives
│       ├── features/     domain modules (auth, plans, workout, nutrition, …)
│       ├── mocks/        in-memory data layer (swappable for the API)
│       └── lib/          api client, secure token store, theme, query client
├── backend/              Express + Prisma + PostgreSQL API
│   ├── prisma/           schema.prisma + seed
│   └── src/
│       ├── config/       env validation
│       ├── db/           prisma client
│       ├── lib/          tokens, errors
│       ├── middleware/   auth, validate, error
│       └── modules/      auth · exercises · plans · sessions · nutrition
├── packages/shared/      Zod schemas + types + calorie/macro math (used by both)
├── pnpm-workspace.yaml
└── PRD.md
```

## Prerequisites

- Node.js ≥ 22.13
- pnpm (`corepack enable pnpm`)
- PostgreSQL running locally (or a connection string)

## Setup

```bash
# 1. Install everything
pnpm install

# 2. Build shared types (app & backend depend on it)
pnpm build:shared

# 3. Backend env + database
cp backend/.env.example backend/.env      # then edit DATABASE_URL + JWT secrets
pnpm --filter @gymcrush/backend db:generate
pnpm db:migrate                            # creates tables
pnpm db:seed                               # exercise + food catalog + dev user
pnpm db:seed:demo                          # optional: demo users with sample data

# 4. App env
cp app/.env.example app/.env               # set EXPO_PUBLIC_API_URL
```

### Test accounts

`pnpm db:seed` creates a single empty **dev account** (`dev@gymcrush.app` / `devpassword123`);
setting `EXPO_PUBLIC_DEV_LOGIN=1` in `app/.env` auto-signs-in with it so you skip the login
screen during development.

`pnpm db:seed:demo` additionally creates three **demo personas** pre-loaded with a body profile,
a plan, several progressive workout sessions, food logs, and weight history — handy for exercising
the data-rich screens. All share the password `demopass123`:

| Email | Goal | Data |
|-------|------|------|
| `alex@demo.gymcrush.app` | Lean bulk | Push Pull Legs · 8 sessions |
| `sam@demo.gymcrush.app` | Fat loss | Upper / Lower · 6 sessions |
| `jordan@demo.gymcrush.app` | Maintain | Full Body 3x · 5 sessions |

Both seeds are idempotent — re-running skips accounts that already exist. Demo accounts are
local-testing only (kept out of the main `db:seed`).

## Running

```bash
pnpm dev:backend   # API on http://localhost:4000  (GET /health to check)
pnpm dev:app       # Expo — press i / a / w for iOS / Android / web
```

## API

Base URL `http://localhost:4000`. All application routes live under `/api` and speak JSON.
Request bodies are validated with the Zod schemas in [`packages/shared`](./packages/shared/src),
so the app and server share one contract.

**Authentication.** Every route except `/health` and `/api/auth/*` requires a bearer access
token:

```
Authorization: Bearer <accessToken>
```

`register` and `login` return `{ user, tokens }` where `tokens = { accessToken, refreshToken }`.
Access tokens are short-lived (~15m); when one expires, exchange the refresh token at
`POST /api/auth/refresh` for a fresh, rotated pair. The app's [`api` client](./app/src/lib/api.ts)
does this transparently on a `401`.

**Errors.** Non-2xx responses are `{ "error": string, "details"?: unknown }`:

| Status | Meaning |
|--------|---------|
| `400` | Validation failed (`details` holds the Zod field errors) |
| `401` | Missing / invalid / expired access token |
| `403` | Authenticated but not allowed (e.g. deleting a catalog exercise) |
| `404` | Not found or not owned by the caller |
| `409` | Conflict (e.g. email already registered) |

Ownership is always scoped to the authenticated user; requesting another user's resource
returns `404` rather than leaking its existence.

### Auth — `/api/auth`

| Method | Path | Body | Returns |
|--------|------|------|---------|
| `POST` | `/register` | `{ email, password, displayName }` | `201` `{ user, tokens }` |
| `POST` | `/login` | `{ email, password }` | `{ user, tokens }` |
| `POST` | `/refresh` | `{ refreshToken }` | `{ tokens }` (rotates the refresh token) |
| `POST` | `/logout` | `{ refreshToken }` | `204` (revokes the refresh token) |

### Exercises — `/api/exercises`

Catalog exercises (`ownerId: null`) are shared by everyone; users can add their own custom ones.

| Method | Path | Body / Query | Returns |
|--------|------|--------------|---------|
| `GET` | `/` | `?search=&muscleGroup=` | `{ exercises: Exercise[] }` (catalog + your custom) |
| `POST` | `/` | `{ name, muscleGroup, equipment }` | `201` `{ exercise }` |
| `DELETE` | `/:id` | — | `204` (only your custom exercises; `403` on catalog) |

### Plans — `/api/plans`

A plan is a tree: **plan → days → exercises** (prescribed sets/reps/RPE/rest).

| Method | Path | Body / Query | Returns |
|--------|------|--------------|---------|
| `GET` | `/` | `?goal=&daysPerWeek=&templatesOnly=` | `{ plans: WorkoutPlan[] }` (your plans + templates) |
| `POST` | `/` | `UpsertPlanInput` | `201` `{ plan }` |
| `GET` | `/:id` | — | `{ plan }` |
| `PUT` | `/:id` | `UpsertPlanInput` | `{ plan }` (replaces the whole day/exercise tree) |
| `POST` | `/:id/duplicate` | — | `201` `{ plan }` (new user-owned copy) |
| `DELETE` | `/:id` | — | `204` |

`UpsertPlanInput`: `{ name, description?, goal, daysPerWeek, isTemplate?, days: [{ name, order, exercises: [{ exerciseId, order, targetSets, targetReps, targetRpe?, restSeconds?, notes? }] }] }`.

### Sessions — `/api/sessions`

The workout logger. Starting a session from a plan day prefills its exercises; sets are logged
individually and upserted by `(loggedExercise, setNumber)`.

| Method | Path | Body / Query | Returns |
|--------|------|--------------|---------|
| `POST` | `/` | `{ name, planId?, planDayId? }` | `201` `{ session }` (prefilled from the plan day) |
| `GET` | `/` | `?limit=` (default 50) | `{ sessions: WorkoutSession[] }` (newest first) |
| `GET` | `/:id` | — | `{ session }` |
| `POST` | `/:id/exercises` | `{ exerciseId }` | `201` `{ loggedExercise }` |
| `POST` | `/sets` | `{ loggedExerciseId, setNumber, weight?, reps?, rpe?, isWarmup?, completed? }` | `{ session }` (create or update the set) |
| `PATCH` | `/:id/finish` | `{ notes? }` | `{ session }` (sets `finishedAt`) |
| `DELETE` | `/:id` | — | `204` (discard) |

### Nutrition — `/api/nutrition`

| Method | Path | Body / Query | Returns |
|--------|------|--------------|---------|
| `PUT` | `/profile` | `UpsertBodyProfileInput` | `{ profile, target }` (recomputes macros via Mifflin-St Jeor) |
| `GET` | `/profile` | — | `{ profile }` |
| `GET` | `/targets` | — | `{ target: { calories, proteinG, carbsG, fatG } }` |
| `PUT` | `/targets` | `{ calories, proteinG, carbsG, fatG }` | `{ target }` (manual override) |
| `GET` | `/foods` | `?search=` | `{ foods: Food[] }` (catalog + your custom) |
| `POST` | `/foods` | `{ name, servingLabel, calories, proteinG, carbsG, fatG }` | `201` `{ food }` |
| `GET` | `/log` | `?date=YYYY-MM-DD` | `{ log }` — entries with per-item + total macros |
| `POST` | `/log` | `{ date, foodId, servings }` | `201` `{ log }` |
| `DELETE` | `/log/entries/:entryId` | — | `204` |
| `GET` | `/weight` | — | `{ history: WeightEntry[] }` (ascending) |
| `POST` | `/weight` | `{ weightKg }` | `201` `{ entry }` (also syncs the profile weight) |

> Every endpoint above is implemented and verified end-to-end against Postgres. Point the app at
> the API by setting `EXPO_PUBLIC_API_URL`, or exercise it directly with `curl` against a freshly
> registered user.

## Useful scripts (from repo root)

| Command | What |
|---------|------|
| `pnpm typecheck` | Typecheck every package |
| `pnpm build:shared` | Compile `packages/shared` |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm dev:app` / `pnpm dev:backend` | Start app / API |

## Stack

- **App:** Expo SDK 57 (RN 0.86, React 19.2), Expo Router, NativeWind, TanStack Query, Zustand, Reanimated
- **Backend:** Express, Prisma, PostgreSQL, JWT (access + refresh), Zod
- **Shared:** Zod schemas + TypeScript types + nutrition formulas

## Current status

- **Backend** — all pillars implemented over Express + Prisma + Postgres: auth (JWT access + rotating refresh), exercises, plans (nested CRUD + duplicate), the workout logger (sessions/sets), and nutrition (profile, macro targets, food log, bodyweight). Every endpoint is validated with shared Zod schemas and verified end-to-end.
- **App** — full UI built across auth, onboarding, and the five tabs (Home · Plans · Log · Nutrition · Profile) plus the plan editor, active-workout logger, and food/weight flows. It currently runs on an in-memory mock layer ([`app/src/mocks`](./app/src/mocks)) behind TanStack Query hooks; swapping a feature onto the live API is a per-feature change in its `hooks.ts`.

Next: wire the app's feature hooks to the real API and add password reset. See [PRD.md](./PRD.md) for the phase plan.
