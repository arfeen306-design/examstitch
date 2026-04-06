# Production Deployment Guide

> **Platform**: Vercel (frontend) + Supabase (database)
> **Last updated**: April 2026

---

## Pre-Deployment Checklist

### Environment Variables

Verify these are set in **Vercel Dashboard > Settings > Environment Variables**:

| Variable | Type | Required | Notes |
|----------|------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Yes | Supabase anon/public key — safe for browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Yes | **Never expose client-side** — used by admin API routes + server actions |
| `NEXT_PUBLIC_SITE_URL` | Public | Yes | Production URL (e.g. `https://examstitch.com`) |
| `NEXT_PUBLIC_SITE_NAME` | Public | No | Display name (defaults to "ExamStitch") |
| `NEXT_PUBLIC_GA_ID` | Public | No | Google Analytics measurement ID |
| `RESEND_API_KEY` | Secret | No | Email service for subscriber notifications |
| `GOOGLE_DRIVE_API_KEY` | Secret | No | For Google Drive PDF embedding |

> **Critical**: `SUPABASE_SERVICE_ROLE_KEY` must be a **Secret** environment variable (not prefixed with `NEXT_PUBLIC_`). It bypasses Row Level Security and has full database access.

### ANON_KEY vs SERVICE_ROLE_KEY

| Key | Access Level | Used By | Exposed to Browser? |
|-----|-------------|---------|---------------------|
| `ANON_KEY` | Respects RLS policies | Client components, middleware, auth flows | Yes |
| `SERVICE_ROLE_KEY` | Bypasses RLS (full access) | Server actions, API routes, admin operations | **Never** |

---

## Deployment Sequence

### Step 1 — Run Database Migrations

```bash
# Ensure you're pointing to the production Supabase project
supabase link --project-ref <your-project-ref>

# Push all pending migrations
supabase db push

# Verify migrations applied (check output for 010 and 011)
supabase migration list
```

**Migrations to verify**:
- `010_cs_module_type_enum.sql` — Adds `module_type` CHECK constraint + NOT NULL
- `011_seed_science_categories.sql` — Seeds grade/paper categories for all subjects

### Step 2 — Build Verification

```bash
# Local build test (catches TypeScript/import errors before deploy)
npm run build

# Expected: "Compiled successfully" with no errors
# The build output shows all routes and their sizes
```

### Step 3 — Deploy to Vercel

```bash
# Option A: Push to main (auto-deploys via Vercel Git integration)
git push origin main

# Option B: Manual deploy via Vercel CLI
vercel --prod
```

### Step 4 — Post-Deploy Verification

1. Visit `https://examstitch.com` — confirm home page loads
2. Visit `https://examstitch.com/admin/login` — confirm admin login works
3. Log in as Super Admin — verify `/admin/super` loads
4. Switch themes — verify persistence across refreshes
5. Check one simulation — verify canvas renders

---

## Rollback Procedure

### Frontend (Vercel)

```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote <deployment-url>
```

Or use **Vercel Dashboard > Deployments** > click the deployment > "Promote to Production".

### Database

```bash
# Revert last migration (if needed)
supabase migration repair <migration-version> --status reverted

# Then re-push
supabase db push
```

> **Warning**: Migration 011 (category seeds) uses `ON CONFLICT DO NOTHING` and is safe to re-run. Migration 010 (module_type constraint) modifies column constraints — reverting requires manual SQL.

---

## Production Monitoring

| What | Where |
|------|-------|
| Build logs | Vercel Dashboard > Deployments > Build Logs |
| Runtime errors | Vercel Dashboard > Logs (or integrate with Sentry) |
| Database | Supabase Dashboard > Table Editor, Logs |
| Analytics | Google Analytics (if `NEXT_PUBLIC_GA_ID` is set) |

---

## First-Time Setup (New Admins)

After deployment, the Super Admin should:

1. Log in to `/admin/super`
2. Go to the **Admin Manager** tab
3. Create subject admin accounts with:
   - Email + temporary password
   - Assigned subjects (e.g. select "Computer Science 0478" + "Computer Science 9618")
4. Share credentials with the teaching team
5. Each admin will be auto-redirected to their subject portal on first login
