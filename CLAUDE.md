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
- **Haptics**: `app/src/lib/haptics.ts` is the only module that talks to `expo-haptics` — a semantic
  vocabulary (`tap`/`selection`/`setComplete`/`restDone`/`pr`/`success`/`warning`/`destructive`) so
  distinct meanings keep distinct feedback. Call the semantic, never `expo-haptics` directly. Restraint
  is deliberate: tab switches and other high-frequency chrome stay silent.
- **Motion**: durations, springs, and press-scale depths live in `app/src/lib/motion.ts` — no inline
  animation constants. `PressableScale`'s `scaleTo` takes a named `pressScale.*` depth.
- **Toasts & confirms**: `toast.*` (`app/src/lib/toastStore.ts`; `ToastHost` is mounted once in the
  root layout) for transient feedback and undo actions; `ConfirmSheet`/`useConfirmSheet`
  (`app/src/components/ui/ConfirmSheet.tsx`, promise-based) for destructive confirmation. Destructive
  actions either confirm first or remove instantly with an undo toast — `Alert.alert` is not used.
  **Never open a ConfirmSheet while another modal is closing** — RN modal dismissal is async on iOS and
  the second modal can silently fail to present; confirm as a step inside the open sheet instead
  (`app/app/plan/[id]/index.tsx` does this). An undo toast must not outlive what it would restore:
  `activeSessionStore`'s `discard`/`finish` call `toast.dismiss()` for exactly that reason.
- **Screen states**: `if (isError) return <ErrorState onRetry={refetch} />` before the loading branch,
  and loading guards use `isPending` (never `isLoading || !data`, which skeletons forever on error).
  `SkeletonList` covers the standard loading stanza; `ScreenScaffold`'s `onRefresh` prop wires
  pull-to-refresh on tab screens. Note the tab bar is opaque and non-absolute, so tab content is laid
  out above it — `ScreenScaffold`'s bottom padding is scroll slack, not tab-bar clearance.
- **Notifications**: `app/src/lib/notifications.ts` is the only place that talks to `expo-notifications`
  (permissions, Android channels, scheduling). Prefs live in `profile/notificationStore.ts`, on
  `kvStorage` like the other device prefs — not MMKV, which is user-scoped and wiped on sign-out. The rest
  notification is scheduled/cancelled from `activeSessionStore` alongside the `restTimer` transitions,
  under a fixed notification id so a cancel still works after a process kill.
  These are **local** notifications only — there is no push token, no server-sent push.
- **Live Activities (iOS)**: `app/src/lib/liveActivity.ts` is the only place that talks to
  `expo-widgets` ActivityKit. Layout lives in `workout/WorkoutLiveActivity.tsx` (`@expo/ui` SwiftUI +
  native `timerInterval` countdown — no per-second JS updates). Started/updated/ended from
  `activeSessionStore` alongside the rest timer; re-bound on MMKV rehydration via
  `getInstances()`. Local app updates only — no push tokens. Requires a native rebuild
  (`expo run:ios` / fresh EAS dev build); Metro reload alone won't pick up the widget extension.
  Two renderer constraints that are invisible until that rebuild, both already hit once:
  **never use `containerRelativeFrame`** — it measures against the activity container rather than the
  padded parent, so it overflows a padded stack on iOS 17+, and it sits behind an `#available(iOS 17)`
  guard, so at the project's 16.4 deployment target it silently does nothing and the stack hugs its
  content instead; fill width with a trailing `Spacer`. And **`Gauge`'s label slots are dropped** —
  `expo-widgets` builds `GaugeView` without children, so `currentValueLabel` never reaches SwiftUI;
  layer the label over the gauge with a `ZStack`. Layout regions render in JavaScriptCore inside the
  extension, so a throw blanks the whole activity (DEBUG shows a red box and logs
  `[ExpoWidgets] Layout evaluation failed:`) — guard anything derived from the nullable rest interval.
- **e1RM / "best set"**: Epley formula (`weight * (1 + reps / 30)`), already used in
  `app/app/exercise/[id].tsx` — reuse the same formula anywhere else a "PR"/"best" needs computing so the
  definition stays consistent app-wide.

## Component library (`app/src/components/ui/`)

AppSwitch, Badge, BottomSheet (drag-to-dismiss + keyboard-avoiding), Button, Card, Chip, ConfirmSheet
(+`useConfirmSheet`), EmptyState, ErrorState, IconButton, ListRow (+ListGroup/ListSeparator),
NumberStepper, PressableScale, ProgressBar, ProgressRing, ScreenHeader, ScreenScaffold, SegmentedControl,
Skeleton (+SkeletonList), Sparkline, SplashOverlay, StatTile, Text (`AppText`, variant system: display/
title/heading/subheading/stat/body/caption/label), TextField, ToastHost. New UI should compose these
rather than styling from scratch. The logger's own components (ExerciseCard, SetRow, RestTimerBar,
SetAdvanceBar, …) live in `app/src/features/workout/components/`, with the cross-card keyboard focus
flow in `app/src/features/workout/useSetFocusFlow.ts` — `app/app/workout/active.tsx` is orchestration
only.
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
- `pnpm test` — Vitest across `packages/shared` and `app` (`pnpm --filter … test:watch` to iterate).
- `pnpm build:shared` — compile `packages/shared` (app and backend depend on the build output).
- `pnpm db:migrate` / `pnpm db:studio` — Prisma migrations / Prisma Studio.

## Model routing

**Use Fable 5 (`claude-fable-5`) for UI/UX and frontend-facing work** — component design, screen layout,
animation/motion, visual polish, copy. Keep backend, data-model, and infra work on the default model.
- Delegating frontend work to a subagent: pass `model: "fable"` on the `Agent` call.
- Working directly in-session on frontend work: switch with `/model fable5`.

## Testing

Vitest, run with `pnpm test`. Suites so far:

- `packages/shared/src/calc.test.ts` — the BMR/TDEE/macro formulas. Expected values are derived by hand
  from the equations in PRD.md, **not** snapshotted from the implementation, so a changed constant fails
  loudly. Keep it that way; a snapshot here would lock in a regression.
- `app/src/lib/notifications.test.ts` + `app/src/features/profile/notificationStore.test.ts` — the
  notification scheduling lifecycle, against a fake that models the OS keeping schedules by identifier
  across a process restart (the property that made the original in-memory-id bug invisible).
- `app/src/lib/haptics.test.ts` — the semantic→native haptic mapping (PR thud-tick timing, web no-op).
- `app/src/lib/toastStore.test.ts` — toast lifecycle: latest-wins replacement, timer ownership,
  action-toast minimum duration.
- `app/src/lib/liveActivity.test.ts` + `app/src/features/workout/workoutActivityProps.test.ts` —
  Live Activity facade no-ops off iOS, orphan rebind on hydrate, and rest-interval prop mapping.
- `app/src/features/workout/workoutLiveActivity.test.ts` — the Live Activity *layout*, asserted
  structurally (width fill, no `containerRelativeFrame`, stable banner height across a rest
  transition, track colour ≠ card colour, countdown direction). It is the one exception to the
  "no component rendering" rule below and does not weaken it: the layout is a pure
  `(props, environment) → node tree` function, not a rendered RN tree. `vitest.config.mts` aliases
  `@expo/ui/swift-ui` to `swiftUiStub.ts` and `react/jsx-runtime` to `widgetJsxRuntime.ts` to stand in
  for what the widget extension provides — keep both faithful to `expo-widgets/bundle/*`.
- `app/src/features/workout/activeSessionStore.test.ts` — rest-timer `adjustRest` math + notification
  re-arming, and `restoreExercise` (the remove-exercise undo path).

`app/vitest.config.mts` runs in a plain node environment and mocks native modules in `vitest.setup.ts`.
It covers **logic only** — stores and `lib/` helpers. Rendering components needs the jest-expo transform
stack (NativeWind + Reanimated + the Expo module registry), which is not set up; add that deliberately
rather than piling more mocks into the node config.

**Not yet covered:** the backend (services need a test Postgres), and any component rendering.

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
