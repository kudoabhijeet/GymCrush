# CI/CD Setup

GitHub Actions workflows deploy the backend to Railway and build the mobile app via EAS.

Branch mapping: **`develop` → staging**, **`main` → production**.

## Workflows

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | PR + push to `develop` / `main` | typecheck, test, lint, backend build |
| [`.github/workflows/deploy-backend.yml`](../.github/workflows/deploy-backend.yml) | push to `develop` / `main` | same checks, then Railway deploy + `/health` smoke test |
| [`.github/workflows/deploy-app.yml`](../.github/workflows/deploy-app.yml) | push to `main` | EAS production build (+ optional submit) |

### What runs when

| Event | CI | Backend deploy | Mobile deploy |
|-------|----|----------------|---------------|
| PR → `develop` or `main` | yes | no | no |
| Push to `develop` | yes | Railway **staging** | no |
| Push to `main` | yes | Railway **production** | EAS **production** build (+ submit if enabled) |

Run the same checks locally:

```bash
pnpm check
```

Do **not** use `pnpm ci` — that is pnpm's built-in clean-install command, not this repo's check script.

## GitHub secrets

Add these under **Settings → Secrets and variables → Actions**:

| Secret | Required by | How to get it |
|--------|-------------|---------------|
| `RAILWAY_TOKEN_STAGING` | deploy-backend (`develop`) | Railway project → staging environment → **Settings → Tokens** (project token) |
| `RAILWAY_TOKEN_PRODUCTION` | deploy-backend (`main`) | Railway project → production environment → **Settings → Tokens** (project token) |
| `RAILWAY_SERVICE_ID_STAGING` | deploy-backend (`develop`) | Staging backend service → Settings → Service ID |
| `RAILWAY_SERVICE_ID_PRODUCTION` | deploy-backend (`main`) | Production backend service → Settings → Service ID |
| `RAILWAY_STAGING_URL` | deploy-backend smoke test | e.g. `https://gymcrushbackend-staging.up.railway.app` |
| `RAILWAY_PRODUCTION_URL` | deploy-backend smoke test | e.g. `https://gymcrushbackend-production.up.railway.app` |
| `EXPO_TOKEN` | deploy-app | [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens) |

Railway project tokens are **per environment**. Use separate staging/production tokens rather than a single account token unless you intentionally want broader CLI access.

Optional repository variable (**Settings → Secrets and variables → Actions → Variables**):

| Variable | Value | Purpose |
|----------|-------|---------|
| `EAS_SUBMIT_ENABLED` | `true` | Enables the submit job after a production build. Leave unset until App Store / Play credentials are configured in EAS. |

### Configure via GitHub CLI

After creating the Railway staging service and copying token/service IDs:

```bash
gh secret set RAILWAY_TOKEN_STAGING
gh secret set RAILWAY_TOKEN_PRODUCTION
gh secret set RAILWAY_SERVICE_ID_STAGING
gh secret set RAILWAY_SERVICE_ID_PRODUCTION
gh secret set RAILWAY_STAGING_URL --body "https://gymcrushbackend-staging.up.railway.app"
gh secret set RAILWAY_PRODUCTION_URL --body "https://gymcrushbackend-production.up.railway.app"
gh secret set EXPO_TOKEN
```

Enable EAS submit once store credentials exist:

```bash
gh variable set EAS_SUBMIT_ENABLED --body "true"
```

## Railway staging environment (one-time)

1. Open the existing Railway project and create a **`staging`** environment (keep **`production`** for `main`).
2. In **staging**, provision:
   - **PostgreSQL** (separate from production)
   - **Backend service** linked to this GitHub repo (`kudoabhijeet/GymCrush`)
3. Set environment variables on the staging backend service (see [`backend/.env.example`](../backend/.env.example)):
   - `DATABASE_URL` — from the staging Postgres plugin
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — unique values (≥ 16 chars)
   - `NODE_ENV=production`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (optional during auth migration)
   - `CORS_ORIGINS` if needed
4. Note the staging public URL and update:
   - GitHub secret `RAILWAY_STAGING_URL`
   - [`app/eas.json`](../app/eas.json) `development` / `preview` `EXPO_PUBLIC_API_URL` if the Railway hostname differs from `gymcrushbackend-staging.up.railway.app`
5. Copy the staging service ID into `RAILWAY_SERVICE_ID_STAGING`.

Production should already be wired; confirm `RAILWAY_SERVICE_ID_PRODUCTION` matches the production backend service.

### Migrations on deploy

Deploys run `prisma migrate deploy` before starting the server via [`backend/scripts/start.sh`](../backend/scripts/start.sh), invoked by the `start:prod` script referenced in [`railway.json`](../railway.json) and [`railpack.json`](../railpack.json).

## Branch protection (after first green CI run)

Under **Settings → Branches**, add rules for `develop` and `main`:

1. Require a pull request before merging (recommended).
2. Require status check **Lint, typecheck, test, build** (the CI job name) to pass.
3. Require branches to be up to date before merging (optional).

The check name appears in GitHub only after CI has run at least once on the target branch.

### Configure via GitHub CLI (after first green CI run)

```bash
# develop
gh api repos/kudoabhijeet/GymCrush/branches/develop/protection -X PUT \
  -f required_status_checks[strict]=true \
  -f required_status_checks[contexts][]="Lint, typecheck, test, build" \
  -f enforce_admins=false \
  -f required_pull_request_reviews[required_approving_review_count]=0 \
  -f restrictions=

# main
gh api repos/kudoabhijeet/GymCrush/branches/main/protection -X PUT \
  -f required_status_checks[strict]=true \
  -f required_status_checks[contexts][]="Lint, typecheck, test, build" \
  -f enforce_admins=false \
  -f required_pull_request_reviews[required_approving_review_count]=0 \
  -f restrictions=
```

Adjust review count if you want required approvals.

## EAS submit credentials

The submit job is gated on `EAS_SUBMIT_ENABLED=true`. Before enabling it, configure store credentials:

```bash
cd app
eas credentials
```

Ensure Apple App Store Connect and Google Play service account credentials are stored in EAS, or add them as GitHub secrets and wire them into the submit workflow later.

## Rollout order

1. Push workflows to `develop` and confirm CI passes.
2. Create Railway staging environment + Postgres; set secrets; confirm staging URL in `eas.json`.
3. Push to `develop` and confirm backend deploy + smoke test.
4. Merge to `main` and confirm production deploy + EAS build.
5. Enable branch protection once CI is stable.
6. Set `EAS_SUBMIT_ENABLED=true` when store credentials are ready.
