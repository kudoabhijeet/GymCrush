# GymCrush 🏋️

A power-user gym app: **workout plans, a fast workout logger, and a smart macro tracker** — with a rich, responsive UI/UX. See [PRD.md](./PRD.md) for the full product spec, phases, and TODOs.

## Monorepo layout

```
GymCrush/
├── app/                  Expo SDK 57 app (Expo Router + NativeWind)
│   ├── app/              file-based routes
│   │   ├── (auth)/       login / register
│   │   └── (tabs)/       Home · Plans · Log · Nutrition
│   └── src/
│       ├── components/ui reusable themed primitives
│       ├── features/     domain modules (auth, …)
│       └── lib/          api client, secure token store, query client
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
pnpm --filter @gymcrush/backend db:seed    # seeds the exercise catalog

# 4. App env
cp app/.env.example app/.env               # set EXPO_PUBLIC_API_URL
```

## Running

```bash
pnpm dev:backend   # API on http://localhost:4000  (GET /health to check)
pnpm dev:app       # Expo — press i / a / w for iOS / Android / web
```

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

Phase 0 (scaffolding) complete: monorepo, shared contracts, auth end-to-end wiring, and screen/route/endpoint skeletons for all pillars. Phase 1 (Plans + Logging) is next — see [PRD.md §7](./PRD.md).
