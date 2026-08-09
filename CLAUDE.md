# CLAUDE.md

Reference doc for working in this repo. Written 2026-08-04; treat as a living document — update it when
the facts below change (see "Living document" at the bottom).

## What GymCrush is

A power-user gym app: workout plans, a fast workout logger, and a macro/calorie tracker, wrapped in a
premium UI. Full spec in [PRD.md](./PRD.md). The core product bet: **median time to log a set < 3s** —
weigh any change to the logger against that.

## Monorepo layout

- `app/` — Expo SDK 57 (RN 0.86, React 19.2), Expo Router (file-based routes), NativeWind (Tailwind for
  RN), TanStack Query (server cache), Zustand (local/UI state), Reanimated (motion).
- `backend/` — Express + Prisma + PostgreSQL API.
- `packages/shared/` — Zod schemas, TS types, and nutrition math. Single source of truth used by both
  `app` and `backend` — if you touch validation or the calorie/macro formulas, change it here, not in
  either consumer.

## Things the docs get wrong — verify before trusting README.md/PRD.md

- **README.md's "in-memory mock layer" is stale.** Every `app/src/features/<domain>/hooks.ts` already
  calls the real API via `app/src/lib/api.ts`, which hits the live Express/Prisma/Postgres backend. There
  is no `app/src/mocks/` directory. Treat the app as live end-to-end.
- **PRD.md's phase checklists are stale.** Several items marked `[ ]` are already implemented — check the
  actual code/routes before assuming a PRD checkbox reflects reality.

## Auth is mid-migration to Supabase

`User` (backend/prisma/schema.prisma) has both a legacy `passwordHash` (nullable, being phased out) and a
nullable `authUserId` (maps to Supabase `auth.users.id`). `backend/src/middleware/auth.ts` tries a
Supabase JWT (ES256 via JWKS) first, falls back to the legacy self-issued HS256 JWT. `RefreshToken` rows
store only SHA-256 hashes with rotation-on-use. `backend/src/lib/supabaseAdmin.ts` holds a service-role
Supabase client (server-only) — e.g. account deletion also deletes the linked Supabase identity. **No
frontend Supabase client exists** — no `@supabase/supabase-js` in `app/`, no anon/publishable key
anywhere in `app/.env*`. Don't assume one is available when building app-side features.

## Storage backends are intentionally split — don't consolidate

- `app/src/lib/storage.ts` (`kvStorage`) — `expo-secure-store` backed, used for small device prefs
  (`profileStore`'s `units`/`theme`). Has a practical ~2KB-per-value ceiling on Android — fine for a
  couple of short strings, not for anything larger.
- `app/src/lib/mmkvStorage.ts` (`react-native-mmkv` backed) — synchronous, no meaningful size ceiling,
  used for larger/hot-path state like the in-progress workout session (`activeSessionStore`).

Both exist on purpose. Adding `react-native-mmkv` (or any other native module) means the dev client needs
a rebuild (`expo run:ios` / a fresh EAS dev build) before the next `pnpm dev:app` — a plain Metro reload
won't pick up new native code, since this app runs on a custom dev client (`expo-dev-client`), not Expo Go.

## Patterns to reuse, not reinvent

- **Tap feedback**: `PressableScale` (`app/src/components/ui/PressableScale.tsx`) — spring scale-down on
  press, used everywhere instead of raw `Pressable`/`TouchableOpacity`.
- **Persisting Zustand state**: `persist` + `partialize`, see `app/src/features/profile/profileStore.ts`.
  Only persist what actually needs to survive restart; keep transient/UI-only fields out of `partialize`.
- **Modal/sheet entrances**: `BottomSheet`'s fade/slide (`app/src/components/ui/BottomSheet.tsx`).
- **Status markers**: `Badge` (`app/src/components/ui/Badge.tsx`) — its own doc comment already
  anticipates use cases like PR markers.
- **Haptics**: `expo-haptics`, distinct feedback types for distinct meanings (e.g. set-complete vs.
  rest-timer-done vs. PR) so the app doesn't collapse everything into one generic buzz.
- **e1RM / "best set"**: Epley formula (`weight * (1 + reps / 30)`), already used in
  `app/app/exercise/[id].tsx` — reuse the same formula anywhere else a "PR"/"best" needs computing so the
  definition stays consistent app-wide.

## Component library (`app/src/components/ui/`)

Badge, BottomSheet, Button, Card, Chip, EmptyState, IconButton, ListRow (+ListGroup/ListSeparator),
NumberStepper, PressableScale, ProgressBar, ProgressRing, ScreenHeader, ScreenScaffold, SegmentedControl,
Skeleton, Sparkline, SplashOverlay, StatTile, Text (`AppText`, variant system: display/title/heading/
subheading/body/caption/label), TextField. New UI should compose these rather than styling from scratch.
Theming: `app/src/lib/theme.ts` mirrors the NativeWind CSS-variable tokens (light/dark, brand lime
`#ccff00`) for the props that can't take a className (icon colors, placeholders, status bar).

## Backend module map (`backend/src/modules/`)

`auth`, `exercises`, `plans`, `sessions`, `nutrition` — each has `*.routes.ts` + `*.service.ts`.
Security-relevant convention: **ownership scoping returns `404`, never `403`**, when a resource exists but
isn't owned by the caller — this avoids leaking existence of other users' data. Preserve this on any new
route. Validation happens via the shared Zod schemas in `packages/shared`, at the boundary — not ad hoc
checks inside services.

## Feature module wiring convention

Each `app/src/features/<domain>/hooks.ts` is the single place that talks to the API for that domain
(TanStack Query hooks wrapping `app/src/lib/api.ts` calls). Swapping a data source or adding an endpoint
for a feature is a change confined to its `hooks.ts`.

## Commands

- `pnpm dev:app` / `pnpm dev:backend` — run the app / API locally.
- `pnpm typecheck` — typecheck every package.
- `pnpm build:shared` — compile `packages/shared` (app and backend depend on the build output).
- `pnpm db:migrate` / `pnpm db:studio` — Prisma migrations / Prisma Studio.

## Model routing

**Use Fable 5 (`claude-fable-5`) for UI/UX and frontend-facing work** — component design, screen layout,
animation/motion, visual polish, copy. Keep backend, data-model, and infra work on the default model.
- Delegating frontend work to a subagent: pass `model: "fable"` on the `Agent` call.
- Working directly in-session on frontend work: switch with `/model fable5`.

## Review subagents

Two project-scoped subagents exist for this repo (`.claude/agents/`):
- `code-reviewer` — pattern consistency, shared-schema correctness, simplification. Run after
  implementing a feature/fix.
- `security-reviewer` — auth/ownership/validation/secrets sweep. Run before merging anything touching
  auth, user data, or external input.

## Living document

This file describes state as of 2026-08-04. Update it when the underlying facts change — e.g. once the
Supabase auth migration completes and the legacy JWT path is removed, once `README.md` is refreshed to
match reality, or once a new cross-cutting pattern gets established.
