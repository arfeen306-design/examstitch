# ExamStitch — Full-Stack Security & Architecture Audit

**Date:** 2026-05-02
**Scope:** Complete codebase (Next.js 14 App Router + Supabase/PostgreSQL + TypeScript)
**Auditor methodology:** Five parallel deep-dive passes covering API/auth integrity, RLS & schema, admin-panel logic, frontend hooks/rendering, and architecture.
**Tone:** Cynical senior auditor. Every finding cites `file:line`. No padding, no academic theory — production-suitable fixes only.

---

## TL;DR — Read This First

The product works, but the **trust boundary is broken in multiple, independently exploitable ways**. A motivated attacker with zero credentials can:

1. **Create, delete, and reset passwords for any student account** by hitting `/api/admin/students` directly — the route has no auth check at all.
2. **Self-promote to super admin** by calling the unguarded `toggleSuperAdmin` Server Action.
3. **Download every locked PDF** by setting a single non-httpOnly `admin_mode=1` cookie.
4. **Read every paid/locked resource URL** anonymously, because a 2026-04-07 migration silently dropped the `is_locked` clause from the public `resources` SELECT policy.
5. **Read their own password hash + salt** from the browser via PostgREST, because `students_read_own` exposes all columns.
6. **Inflate / forge analytics** for any student UUID via `/api/media/view` and `/api/resources/views`.
7. **Burn the OpenAI bill** on `/api/quiz/generate` — no auth, no rate limit, `regenerate=true` bypasses cache.

Beyond security, the **data model is patched-forward, not designed**: 5 "repair" migrations in 5 days, 7 ungoverned root-level `*.sql` files, duplicate-prefixed migrations (`010_*`, `011_*`), and a `student_accounts` table that holds password hashes + role + super-admin flag but **is not created in any migration in the repo** — it lives only in production. There are zero automated tests.

The bones are good (App Router structure, RLS posture in places, typed Supabase clients, `unstable_cache` discipline, a sophisticated trigger-based identity guard for `resources`). But scaling past 8 subjects or onboarding a second engineer requires fixing the items in §1 below within the next sprint.

---

## §1 — Top 10 Fixes, Ranked

| # | Finding | Severity | Effort | One-line fix |
|---|---|---|---|---|
| 1 | `/api/admin/students` POST/PATCH/DELETE has zero auth | Critical | XS | Add `await getAdminSession()` guard at top of every handler. |
| 2 | Super-admin Server Actions (`createSubject`, `assignSubjectToAdmin`, `removeSubjectFromAdmin`, `createAdminAccount`, `deleteAdminAccount`, `toggleSuperAdmin`) have zero auth | Critical | S | Add `await requireSuperAdmin()` to every export in `src/app/admin/super/actions.ts`. |
| 3 | `admin_mode=1` cookie is server-trusted as an admin bypass for locked PDFs | Critical | XS | Delete the `admin_mode` server-side reads in `src/app/view/[id]/page.tsx:108` and `src/app/api/pdf/[id]/route.ts:195-196`. |
| 4 | `students_read_own` policy leaks `password_hash` + `salt` to every authenticated student | Critical | S | `REVOKE SELECT (password_hash, salt) ON student_accounts FROM authenticated, anon;` |
| 5 | Public `resources` SELECT policy lost its `is_locked = false` clause | Critical | XS | Migration: re-add `AND (is_locked = false OR auth.role() = 'authenticated')` to the latest policy. |
| 6 | `student_accounts` table is not in any migration file | Critical | M | Add `00X_create_student_accounts.sql` with full DDL + RLS + revokes for sensitive columns. |
| 7 | All super-admin/digital-skills/STEM CRUD Server Actions use service-role client without guards | Critical | M | Wrap every export in `src/app/admin/{super,super/digital-skills,super/stem,[subject]/categories,shared}/actions.ts` with `requireSuperAdmin()` / `requireSubjectAdmin()`. |
| 8 | No rate limit anywhere — login routes, AI quiz generator, view counters | High | S | Add `@upstash/ratelimit`. 5/5min on login, 5/hour on `/api/quiz/generate`, 1/min/IP on view counters. |
| 9 | Custom unsalted SHA-256 password hash in `student_accounts` (alongside Supabase Auth) | High | M | Drop the custom hash entirely; rely on Supabase Auth's bcrypt. Force a password rotation. |
| 10 | `admin_subjects` / `admin_landing` cookies set at login persist 7 days even after demotion | High | M | Stop trusting login-time cookies for permission checks. Re-derive from DB in middleware (cached, 60s TTL). |

After these ten, the next 130+ findings tighten validation, fix race conditions, and pay down architecture debt.

---

## §2 — Cross-Cutting Themes (the structural bugs)

### Theme A: "The middleware will catch it" (it won't)
`src/middleware.ts:142` matches **page** routes — `/admin/*`, `/dashboard`, `/premium` — never `/api/*`. Every API route handler must call `getAdminSession()` itself. Most of the dangerous ones do not. Server Actions are similarly unguarded; they're reachable as POSTs by anyone who can locate their action ID in the client bundle.

### Theme B: Cookie state never re-syncs with DB
The login route at `src/app/api/admin/login/route.ts:117-134` stamps `admin_landing` and `admin_subjects` cookies at login from a one-shot DB read. Middleware at `src/middleware.ts:118` trusts those cookies for 7 days. When a super-admin demotes Bob, Bob keeps middleware-level access until he logs out. The `admin_session` cookie value is the literal user UUID — there's no per-session opaque token, no DB-side session table, no revocation primitive.

### Theme C: Two parallel identity systems (`auth.users` + `student_accounts`)
The codebase rolls its own password hashing in `student_accounts.password_hash`/`salt` (`src/lib/password.ts:14-26` — single SHA-256, no work factor) **alongside Supabase Auth**. `student_accounts.id` is presumed to equal `auth.uid()` but no FK enforces it. The `users` table from migration 008 is half-deprecated, half-active. `is_admin()` only consults `student_accounts`. This is a redesign-grade smell.

### Theme D: Data model patched in production
Migration history shows `20260417_resource_subject_integrity`, `20260420_final_math_sync`, `20260420_resources_module_type_lane_repair`, `20260422_enforce_resource_integrity`, `20260422_resources_discipline_linkage_repair` — five "repair" migrations in a week. Plus 7 unmanaged root-level `*.sql` patches (`add_module_type.sql`, `fix_resources.sql`, `fix_schema_mismatch.sql`, `seed_categories.sql` (with `DELETE FROM categories;`), etc.) that have been hand-pasted into prod. Plus duplicate-prefixed migrations (`010_add_is_locked_to_resources.sql` vs `010_cs_module_type_enum.sql`; same for 011). The trigger `enforce_resource_category_identity` (`supabase/migrations/20260422_enforce_resource_integrity.sql:24-58`) finally pins identity going forward — but a fresh `supabase db reset` will not produce today's prod schema.

### Theme E: Zero tests
No test runner installed, no `*.test.ts` files, no CI gate. The project's own `CLAUDE.md` specifies "TDD London School" yet nothing is tested. Every refactor is a coin flip.

---

## §3 — Critical Findings

> Severity rubric: **Critical** = exploit yields full account takeover, mass data leak, or financial damage; usable by an unauthenticated attacker or a low-privileged user.

### C-01 — `/api/admin/students` has no authentication on any verb
- **File**: `src/app/api/admin/students/route.ts:7-161`
- **Category**: AuthZ
- **Phase**: API Auth
- **Explanation**: All three handlers (`POST`, `PATCH`, `DELETE`) call `createAdminClient()` (service role, RLS bypass) with **no `getAdminSession()` check**. The middleware does not protect `/api/*`. Anyone with internet access can mint accounts, toggle `is_active`, hard-delete student rows including the linked `auth.users` row, and reset arbitrary passwords — `PATCH` with `{ "id": "<uuid>", "reset_password": true }` returns the new plaintext password in the JSON response.
- **Reproduction**:
  ```bash
  curl -X PATCH https://example.com/api/admin/students \
    -H 'Content-Type: application/json' \
    -d '{"id":"<known-uuid>","reset_password":true}'
  # → { "newPassword": "xY7..." }
  ```
- **Recommended Fix**:
  ```ts
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // For PATCH/DELETE additionally:
  if (!session.isSuperAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  ```

### C-02 — Super-admin Server Actions ship without auth guards
- **File**: `src/app/admin/super/actions.ts:9, 40, 75, 102, 169, 207`
- **Category**: AuthZ
- **Phase**: API Auth + Admin Logic
- **Explanation**: `createSubject`, `assignSubjectToAdmin`, `removeSubjectFromAdmin`, `createAdminAccount`, `deleteAdminAccount`, and `toggleSuperAdmin` all instantiate `createAdminClient()` with no session check. The neighbouring `provisionPortalHierarchy` (line 246) and `seedDisciplineSubjectsFromApp` (line 280) do call `getAdminSession()` — confirming this was an oversight in the destructive ones. Server Actions are reachable as POSTs by anyone who locates the action ID in the client bundle.
- **Reproduction**: A regular subject admin — or anyone with the action ID — can call `toggleSuperAdmin(<their_user_id>, true)` to self-elevate.
- **Recommended Fix**:
  ```ts
  export async function toggleSuperAdmin(userId: string, makeSuperAdmin: boolean) {
    const session = await requireSuperAdmin();
    if (!session) return { success: false, error: 'Unauthorized' };
    // ...existing body
  }
  ```
  Apply identically to all 6 exports in this file.

### C-03 — Digital-skills CRUD Server Actions are entirely unauthenticated
- **File**: `src/app/admin/super/digital-skills/actions.ts:17-303` (every export)
- **Category**: AuthZ + Stored XSS
- **Phase**: API Auth
- **Explanation**: 13 exports (`createSkill`, `updateSkill`, `deleteSkill`, `createPlaylist`, `deletePlaylist`, `createLesson`, `updateLesson`, `deleteLesson`, `grantStudentAccess`, `revokeStudentAccess`, `reorderPlaylists`, `reorderLessons`, `uploadDigitalSkillAsset`) all call `createAdminClient()` with no session check. `uploadDigitalSkillAsset` (line 355) writes any 50 MB file (multiple MIME types) to Supabase Storage and returns a 1-year signed URL — XSS payloads served from your own domain.
- **Reproduction**: An anonymous attacker calls `grantStudentAccess(<my_student_uuid>, <premium_skill_uuid>)` — instant freeloader. Or uploads `<script>fetch("/api/admin/students", ...)</script>` as a "lesson asset" hosted on your domain.
- **Recommended Fix**: `await requireSuperAdmin()` at the top of every export. Validate file types server-side (don't trust the client MIME), and use `Content-Disposition: attachment` for asset downloads.

### C-04 — STEM simulation CRUD is unguarded and stores arbitrary HTML
- **File**: `src/app/admin/super/stem/actions.ts:19, 90, 119, 131`
- **Category**: AuthZ + Stored XSS
- **Phase**: API Auth
- **Explanation**: `createSimulation`, `updateSimulation`, `deleteSimulation`, `toggleSimulationStatus` are unguarded. The `html_code` field is stored verbatim and rendered into `SimulationViewer` iframes. An attacker creates `status: 'published'` rows containing `<script>` payloads.
- **Recommended Fix**: `await requireSuperAdmin()` at top. Sandbox the iframe (`sandbox="allow-scripts"` *minus* `allow-same-origin`). Sanitize `html_code` server-side via DOMPurify for defence-in-depth.

### C-05 — Demo bookings PATCH/DELETE are unauthenticated
- **File**: `src/app/api/demo-bookings/route.ts:128-159`
- **Category**: AuthZ + IDOR
- **Phase**: API Auth
- **Explanation**: `POST` is intentionally public (booking creation), but `PATCH` and `DELETE` use `createAdminClient()` with no auth check. UUIDs leak via `booking_ref` returned to clients and via the Google Sheets webhook.
- **Recommended Fix**: `await getAdminSession()` and reject when null on PATCH/DELETE only.

### C-06 — Subject category Server Actions miss auth guards
- **File**: `src/app/admin/[subject]/categories/actions.ts:19, 130, 149`
- **Category**: AuthZ
- **Phase**: API Auth
- **Explanation**: `createSubjectCategory`, `renameCategory`, `deleteSubjectCategory` mutate the categories tree with no `requireSubjectAdmin()` check. The neighbours `seedPortalDefaultCategories` and `quickSetupSubjectPortal` *do* call the guard, so the inconsistency is a clear oversight.
- **Recommended Fix**: For `createSubjectCategory`, `await requireSubjectAdmin(payload.subject_id)`. For `renameCategory`/`deleteSubjectCategory`, look up `subject_id` from the row first.

### C-07 — Resource & blog CRUD Server Actions partially unguarded
- **File**: `src/app/admin/actions.ts:118 (toggleResourceFlag), 366 (deleteResource), 380 (updateResource), 411 (createCategory), 487 (deleteCategoryWithAction), 534 (createBlogPost), 561 (deleteBlogPost)`
- **Category**: AuthZ
- **Phase**: API Auth + Admin Logic
- **Explanation**: `bulkInsertResources` (line 135) correctly calls `getAdminSession()`, but the seven exports above bind directly to `createAdminClient()`. Anyone can vandalise content by deleting rows or flipping `is_published`.
- **Recommended Fix**: Top-of-export `getAdminSession()` plus `requireSubjectAdmin(subject_id)` derived from the resource's category.

### C-08 — `/api/quiz/generate` is unauthenticated and uncapped (OpenAI cost abuse)
- **File**: `src/app/api/quiz/generate/route.ts:29-265`
- **Category**: AuthZ + Cost Abuse + Rate Limit
- **Phase**: API Auth
- **Explanation**: No auth, no per-user rate limit. Calls `gpt-4o-mini` with up to 16,384 max tokens per request. The `regenerate=true` query bypasses the cache. Each call is 0.5–2¢ in OpenAI cost.
- **Reproduction**: A loop of `curl POST /api/quiz/generate -d '{"lessonId":"<known>","regenerate":true,"difficulty":"<random>"}'` drains the OpenAI bill in minutes.
- **Recommended Fix**: (a) Require an authenticated student via `supabase.auth.getUser()`. (b) Per-user rate limit (5/hour). (c) Reject `regenerate=true` for non-admins. (d) Cap `max_tokens` to 4,096 for non-admins.

### C-09 — Server-trusted `admin_mode` cookie is a complete locked-content bypass
- **File**: `src/app/view/[id]/page.tsx:108`, `src/app/api/pdf/[id]/route.ts:195-196`, `src/middleware.ts:53-62`
- **Category**: AuthZ — Cookie Forgery
- **Phase**: API Auth
- **Explanation**: `admin_mode=1` is an intentionally non-httpOnly cookie meant as a UI hint for hiding lock badges. But two server-side code paths read it as **proof of admin** to bypass the locked-PDF gate. Anyone can `document.cookie = 'admin_mode=1'` from the browser console and then download every paid PDF.
- **Reproduction**:
  ```bash
  curl -b 'admin_mode=1' https://example.com/api/pdf/<locked_resource_id> -o pwn.pdf
  ```
- **Recommended Fix**: Replace every server-side read of `admin_mode` with `await getAdminSession() !== null`. Document in `src/middleware.ts:51` that `admin_mode` is **purely** a UI hint.

### C-10 — `admin_session` cookie value = raw user.id; no role re-check at middleware
- **File**: `src/middleware.ts:88`, `src/app/api/admin/login/route.ts:70-76`
- **Category**: AuthN — Stale Privilege
- **Phase**: API Auth + Admin Logic
- **Explanation**: The cookie is httpOnly, but its value is the literal admin's user UUID. The middleware confirms `cookie.value === auth.uid()` — but never re-fetches the role from `student_accounts`. A user demoted from admin keeps middleware access for 7 days (cookie maxAge). Combined with the missing API guards in C-01..C-07, this is a 7-day window of exploit after demotion. Worse, `admin_subjects` and `admin_landing` cookies (set at login at lines 117/127) are **never refreshed** even on subject reassignment — a Maths admin moved to CS sees CS routes blocked but Maths routes still allowed for 7 days.
- **Recommended Fix**: Replace the cookie with an opaque session token; store `(token → user_id, role, expires_at)` in a new `admin_sessions` table; look up role on every request (cached 60s edge-side). On role/subject mutation, delete the session row → instant invalidation.

### C-11 — `students_read_own` exposes `password_hash` + `salt` to every authenticated student
- **File**: `supabase/rls-policies.sql:220-223`; column definitions in `src/lib/supabase/types.ts:213-216`
- **Category**: Data Leak — Credential Exposure
- **Phase**: RLS
- **Explanation**: Policy is `FOR SELECT TO authenticated USING (id = auth.uid())` over the entire row. From the browser, any logged-in student runs `supabase.from('student_accounts').select('*').eq('id', myId)` and gets back their own `password_hash`, `salt`, `is_super_admin`, `managed_subjects`, and `role` — all PII + credential material. With offline GPU brute-forcing of unsalted SHA-256 (≈10 GH/s, see C-15), every password falls.
- **Recommended Fix**: Either (a) move `password_hash`/`salt` out of `public` schema, or (b) add a column-level revoke:
  ```sql
  REVOKE SELECT (password_hash, salt, role, is_super_admin, managed_subjects)
    ON public.student_accounts FROM authenticated, anon;
  GRANT SELECT (password_hash, salt, role, is_super_admin, managed_subjects)
    ON public.student_accounts TO service_role;
  ```
  Long-term: drop the custom hashing entirely (see C-15).

### C-12 — `student_accounts`, `demo_bookings`, `media_widgets` tables are not in any migration file
- **File**: All migrations referencing `student_accounts` (`011_user_progress.sql:8`, `012_multi_subject.sql:57`, `013_digital_skills.sql:54`, `rls-policies.sql:213`); table never created in `supabase/migrations/*`
- **Category**: Schema Integrity
- **Phase**: RLS + Architecture
- **Explanation**: The `student_accounts` table holds the credential blobs and role flags but is referenced as a foreign key without ever being created. Same applies to `demo_bookings` and `media_widgets`. Production was bootstrapped manually via the Supabase UI; the schema is unreproducible from this repo. A fresh `supabase db reset` will fail; any new environment is broken; the RLS state of these tables in prod is unverifiable.
- **Recommended Fix**: Add `00X_create_student_accounts.sql` containing the full DDL (matching prod) plus `ENABLE ROW LEVEL SECURITY`, all policies, and the column-level revokes from C-11. Repeat for `demo_bookings` and `media_widgets`. Verify by running on a fresh Supabase project.

### C-13 — Public `resources` SELECT lost its `is_locked` clause — locked content is now anon-readable
- **File**: `supabase/migrations/20260407_rls_ensure_public_reads.sql:46-48` (overwrites earlier policies in `005_create_resources.sql:59-64`, `010_add_is_locked_to_resources.sql:15-24`, and `rls-policies.sql:84-87`)
- **Category**: RLS Bypass
- **Phase**: RLS
- **Explanation**: There are four sequential `CREATE POLICY "resources_public_read" ... ON resources` policies introduced over time. Each replaces the previous. The latest predicate is `USING (is_published = true)` — the `AND (is_locked = false OR auth.role() = 'authenticated')` from migration 010 is **gone**. The "login wall" feature is effectively dead.
- **Reproduction**:
  ```js
  // From an anonymous browser:
  const { data } = await supabaseAnon.from('resources').select('source_url').eq('is_locked', true);
  // Returns paid YouTube IDs, Drive file IDs, and gated PDF URLs.
  ```
- **Recommended Fix**: New migration `0YY_resources_public_read_relock.sql`:
  ```sql
  DROP POLICY "resources_public_read" ON public.resources;
  CREATE POLICY "resources_public_read" ON public.resources
    FOR SELECT
    USING (is_published = true AND (is_locked = false OR auth.role() = 'authenticated'));
  ```

### C-14 — Top-level `seed_categories.sql` contains an unguarded `DELETE FROM categories;`
- **File**: `seed_categories.sql:114`
- **Category**: Migration Safety
- **Phase**: RLS + Architecture
- **Explanation**: A bare `DELETE FROM categories;` inside a `DO $$` block at the project root, with no environment check and no idempotency guard. With `ON DELETE CASCADE` on subjects/resources, accidentally pasting this into prod's SQL editor wipes most of the catalog.
- **Recommended Fix**: Delete the file or move it to `scripts/dev-seed-categories.sql` with a leading `RAISE EXCEPTION 'do not run in prod';` guard. Replace with a proper idempotent `INSERT ... ON CONFLICT DO NOTHING` seed in `supabase/seeds/`.

### C-15 — Custom unsalted SHA-256 password hashing alongside Supabase Auth
- **File**: `src/lib/password.ts:14-26`
- **Category**: AuthN — Weak Hashing
- **Phase**: API Auth
- **Explanation**: One-round SHA-256 with `sha256(salt + ':' + password)`. SHA-256 is fast — modern GPUs do >10 GH/s. With auto-generated 8-character alphanumeric passwords (~46 bits of entropy), brute force is hours per hash. Combined with C-11 (exposure of the hash to the student themselves), the cost is even lower. `verifyPassword` also uses non-constant-time compare (`computed === hash`).
- **Recommended Fix**: Drop the custom hash. Supabase Auth already manages bcrypt/scrypt-based hashes. If you must keep it, switch to Argon2id or scrypt with appropriate work factors and constant-time compare.

### C-16 — `is_admin()` / `is_super_admin()` SECURITY DEFINER functions lack `SET search_path`
- **File**: `supabase/rls-policies.sql:23-35, 37-50, 53-69`
- **Category**: Privilege Escalation
- **Phase**: RLS
- **Explanation**: Textbook PostgreSQL SECURITY DEFINER footgun. A user able to create objects in `public` (or with a tampered `search_path`) can shadow `student_accounts` with a fake table that returns `role='admin'`. Supabase docs explicitly warn about this.
- **Recommended Fix**:
  ```sql
  CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql SECURITY DEFINER STABLE
    SET search_path = public, pg_catalog
    AS $$ SELECT EXISTS (
      SELECT 1 FROM public.student_accounts
      WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    ); $$;
  REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
  ```
  Apply to all three helper functions.

### C-17 — Hand-written `Database` type drifts from live schema; 46 `as unknown as` casts hide it
- **File**: `src/lib/supabase/types.ts:99-123` (`resources` Row missing `module_type`, `worksheet_url`, `sort_order`); plus `src/types/index.ts:1-30` defines a parallel camelCase `Resource`
- **Category**: Type Safety
- **Phase**: Architecture
- **Explanation**: Two `Resource` types coexist — snake_case in `lib/supabase/types.ts`, camelCase in `types/index.ts`. Both are imported across the codebase. Columns referenced 88 times (`module_type`, etc.) are missing from the Row type, forcing `as unknown as Resource[]` everywhere. TypeScript provides zero protection against schema drift.
- **Recommended Fix**:
  1. `npx supabase gen types typescript --project-id ... > src/lib/supabase/types.generated.ts`
  2. Pass it as the generic: `createClient<Database>(...)`.
  3. Delete `src/types/index.ts`. If a UI shape is needed, derive it: `type ResourceVM = Pick<Tables<'resources'>, ...>`.
  4. Mass-delete `as unknown as` casts.

### C-18 — Background animation on every public page burns CPU forever (O(n²) per frame)
- **File**: `src/components/ui/PlexusBackground.tsx:155-175`
- **Category**: Memory Leak / Wasted Render
- **Phase**: Frontend Perf
- **Explanation**: 90 particles × 90 = 8,100 distance checks per frame at 60fps ≈ 486k computations/sec. Plus a regex string-replace on the line-color inside the inner loop (line 165-168). Mounted in `app/layout.tsx` for every non-admin route. No `prefers-reduced-motion` guard, no IntersectionObserver, no `visibilitychange` pause. On a low-end Android, this eats 30-50% of one core continuously.
- **Recommended Fix**:
  ```ts
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(rafId);
    else rafId = requestAnimationFrame(tick);
  });
  ```
  Cache the line color outside the inner loop. Drop `PARTICLE_COUNT` to 40 and use a coarse spatial grid.

### C-19 — `AskAnythingWidget` mounts three iframes (Desmos, graphing, Gemini) on every public page
- **File**: `src/components/ui/AskAnythingWidget.tsx:489-496`
- **Category**: Bundle Size / Memory Leak
- **Phase**: Frontend Perf
- **Explanation**: All three providers render simultaneously and toggle `display: none`. Desmos alone is ~3 MB of JS. `display: none` does not unload an iframe — they stay live in memory (~50-80 MB of detached frames per page).
- **Recommended Fix**: `{open && PROVIDERS.filter(p => p.id === activeTab).map(p => <AiFrame ... />)}`. Mount only the active provider, only when the modal is open.

### C-20 — `SimulationViewer` adds a non-passive global `mousemove` listener
- **File**: `src/components/stem/SimulationViewer.tsx:194-213`
- **Category**: Memory Leak / Wasted Render
- **Phase**: Frontend Perf
- **Explanation**: `window.addEventListener('mousemove', onMouseMove)` (line 208), non-passive, sets state hundreds of times/sec. Effect deps `[showInstructions]` re-bind the listener on every panel toggle, with timer cleanup races. Combined with the doodle canvas resize handler (lines 287-298) that does no debouncing and the keyboard listener at 412-441, every simulation page binds 4+ global listeners.
- **Recommended Fix**: rAF-throttle `onMouseMove`, mark `{ passive: true }`, debounce resize 150ms, read `showInstructions` from a ref so the effect deps drop to `[]`.

---

## §4 — High Findings

### H-01 — Custom-named `redirectTo` query param on `/auth/login` enables open-redirect phishing
- **File**: `src/app/auth/login/page.tsx:37-40`
- **Category**: Open Redirect
- **Explanation**: After successful login, `window.location.href = redirectTo` runs with no validation. `?redirectTo=https://evil.tld/phish` works.
- **Fix**: Reject any value not matching `/^\/[^/]/` (path-only, not protocol-relative). Or `new URL(redirectTo, location.origin).origin === location.origin`.

### H-02 — `/api/revalidate` accepts the secret in the URL query string
- **File**: `src/app/api/revalidate/route.ts:15-23, 55-82`
- **Category**: Info Disclosure
- **Explanation**: Secrets in URLs end up in CDN logs, server access logs, and browser history.
- **Fix**: Drop the query-param branch; require `Authorization: Bearer <token>` only. Update `supabase/webhooks/README.md`.

### H-03 — `/api/media/view` and `/api/resources/views` accept arbitrary `student_id` / `resource_id`
- **File**: `src/app/api/media/view/route.ts:12-39`, `src/app/api/resources/views/route.ts:12-37`
- **Category**: IDOR + Analytics Pollution
- **Explanation**: Both routes service-role-insert with caller-supplied IDs. No auth, no rate limit. Errors are silently swallowed (`return 200`). Attribution can be falsified to any UUID.
- **Fix**: Derive `student_id` from `supabase.auth.getUser()`; reject body field. Validate `resource_id`/`widget_id` exists. Per-IP rate limit (1/min/resource).

### H-04 — No rate limit on any login endpoint
- **File**: `src/app/api/admin/login/route.ts:8`, `src/app/api/auth/student-login/route.ts:8`
- **Category**: Brute Force
- **Fix**: Install `@upstash/ratelimit`. 5 attempts / 5 min / IP, 20 / hour / email.

### H-05 — Admin login error message reveals admin-vs-student
- **File**: `src/app/api/admin/login/route.ts:60-67`
- **Category**: Info Disclosure
- **Explanation**: Bad password → "Invalid email or password" (401); valid Supabase login but role≠admin → "Access denied. Admin privileges required." (403). An attacker who already cracked a student password can confirm whether that account is an admin.
- **Fix**: Always return 401 with the generic message regardless of which check failed.

### H-06 — No CSRF defence on state-changing API routes
- **File**: All `/api/admin/*`, `/api/demo-bookings`, `/api/subscribers`, `/api/progress/update`, `/api/media/view`
- **Category**: CSRF
- **Fix**: Reject any POST/PATCH/DELETE without a same-origin `Origin` header. Apply via shared `withApiHandler` wrapper (see H-19).

### H-07 — `resource_views_admin_read` and `skill_playlist_views` SELECT policies leak analytics
- **File**: `supabase/migrations/20260407_rls_ensure_public_reads.sql:91-94`, `supabase/migrations/014_trending_skills.sql:25-27`
- **Category**: Data Leak
- **Explanation**: Both policies are `USING (true)`. Any logged-in (or anon, for skill_playlist_views) user reads who-viewed-what across the platform.
- **Fix**: `USING (public.is_admin())` or drop entirely.

### H-08 — `subscribers_admin_read`, `tutor_applications_admin_read`, `users_admin_read`, `user_progress_admin_read` are dead policies
- **File**: `supabase/migrations/007_create_subscribers.sql:28-29`, `008_create_users_and_blog.sql:32, 54`, `011_user_progress.sql:28`
- **Category**: RLS Bypass (latent)
- **Explanation**: All gated on `auth.role() = 'service_role'` — but service-role bypasses RLS entirely, so the predicate never evaluates. They're functional no-ops but give a misleading sense of protection. A future PR softening them to `USING (auth.role() = 'authenticated')` would mass-leak emails/PII.
- **Fix**: Replace each with `USING (public.is_admin())` or delete them.

### H-09 — Anonymous wide-open `INSERT` on `subscribers` and `tutor_applications`
- **File**: `supabase/migrations/007_create_subscribers.sql:24-25`, `008_create_users_and_blog.sql:50-51`
- **Category**: Data Pollution / PII Flooding
- **Explanation**: `WITH CHECK (true)` on INSERT, no rate limit, no email-format check, no length cap on `qualifications`/`experience` text fields.
- **Fix**: Add CHECK constraints (`length(email) <= 254 AND email ~* '^[^@]+@[^@]+\.[^@]+$'`, length caps on free-text columns); rate-limit at the Edge.

### H-10 — `resource_solutions` SELECT exposes mappings for unpublished papers
- **File**: `supabase/migrations/006_create_resource_solutions.sql:27`
- **Category**: Data Leak
- **Explanation**: `USING (true)` — every Q→video timestamp mapping is public, including for unpublished/draft papers.
- **Fix**:
  ```sql
  USING (EXISTS (SELECT 1 FROM resources r WHERE r.id = paper_id AND r.is_published = true));
  ```

### H-11 — `categories_admin_write` doesn't scope to `admin_manages_subject`
- **File**: `supabase/rls-policies.sql:160-164`
- **Category**: Privilege Escalation (admin tier)
- **Explanation**: Gated only on `is_admin()` — a Maths admin can rename or delete a CS category.
- **Fix**: `USING (public.is_admin() AND (public.is_super_admin() OR public.admin_manages_subject(subject_id)))`.

### H-12 — `stem_simulations.html_code` is readable by anon
- **File**: `supabase/migrations/20260404_create_stem_simulations.sql:55-57`
- **Category**: Data Leak
- **Explanation**: `USING (status = 'published')` returns the entire row including `html_code`. Comment claims "filtered at app layer" — wrong defence; an anon JS client can `.select('html_code')` directly.
- **Fix**: Column-level revoke + `SECURITY DEFINER` RPC `get_simulation_html(slug)` that filters and returns html for published rows.

### H-13 — `bulkInsertResources` skips subject scoping when `expectedSubjectId` is omitted
- **File**: `src/app/admin/actions.ts:135-159`; `src/components/admin/BulkResourceUploader.tsx`; `src/app/admin/(dashboard)/resources/BulkUploadPreview.tsx:31`
- **Category**: AuthZ — Cross-tenant Write
- **Explanation**: When the caller passes no `expectedSubjectId`, the only guard is `session.managedSubjects` containing the row's `subject_id`. The global Bulk-Upload page never sets `expectedSubjectId`, so a recently-demoted admin (still holding stale `managed_subjects` server-side until refresh) can write across subjects.
- **Fix**: Make `expectedSubjectId` required. Resolve it from `category_id` server-side; reject mixed-subject batches.

### H-14 — Optimistic toggle revert uses captured-at-click value, desyncs on double-click
- **File**: `src/components/admin/SubjectResourceManager.tsx:432-441`, `src/app/admin/(dashboard)/resources/ResourceGridClient.tsx:196-205`, `src/app/admin/cs/CSResourceTable.tsx:122-133`
- **Category**: Optimistic Update / Race Condition
- **Explanation**: Two rapid clicks → two in-flight requests; each failure reverts to the *captured* value, not the present UI state. Final state desyncs from DB.
- **Fix**: Disable the toggle while `isPending`; on failure, `router.refresh()` instead of value-revert.

### H-15 — `useState(initial)` ignores prop changes — stale lists after `router.refresh()`
- **File**: `src/app/admin/(dashboard)/bookings/BookingsClient.tsx:72`, `BlogEditorClient.tsx:35`, `StudentsClient.tsx:16`, `super/SuperAdminClient.tsx` (MediaManager `items`, line 845)
- **Category**: State Desync
- **Fix**: Add `useEffect(() => setRows(initial), [initial])`. (`SubjectResourceManager` already does this — replicate.)

### H-16 — Admin login `router.push` + `router.refresh` race; users see "log in twice"
- **File**: `src/app/admin/login/page.tsx:33-34`
- **Category**: Race Condition
- **Fix**: Use `window.location.assign(data.redirectTo)` for a hard nav so the cookie is unambiguously present, **or** await a microtask.

### H-17 — `deleteAdminAccount` is non-atomic; orphans Supabase Auth user on profile-delete success / auth-delete failure
- **File**: `src/app/admin/super/actions.ts:185-203`
- **Category**: State Desync — Backend
- **Fix**: Reverse the order (delete Auth user first; cascade FK handles the profile), or wrap in a Postgres SECURITY DEFINER function that does both inside a transaction.

### H-18 — Hardcoded primary super-admin email; the *only* super-admin can self-demote
- **File**: `src/app/admin/super/actions.ts:181-183, 219-221`
- **Category**: UI/Backend Mismatch
- **Explanation**: Protection is `if email === 'arfeen306@gmail.com'`. If that account changes email or is deleted via DB, protection fails. Any *other* super admin can demote themselves even when they are the last one — locking everyone out.
- **Fix**: Replace with `is_primary_super_admin BOOLEAN` column. Add a count check: refuse demotion when it would leave 0 super admins.

### H-19 — Inconsistent error handling across 30+ API routes; some leak raw DB errors
- **File**: `src/app/api/admin/students/route.ts:65, 130, 158`; `demo-bookings/route.ts:137, 153`; `skills/[id]/route.ts:51`; `tutors/[slug]/route.ts:28`; `skills/route.ts:52-54`
- **Category**: Info Disclosure
- **Explanation**: Several routes return `error.message` to the client (raw Postgres error: schema names, constraint names, FK target columns). No shared error-handler / response envelope.
- **Fix**: `src/lib/api/handler.ts` with `withApiHandler(fn)` that adds `x-request-id`, normalizes errors into `{error:{code,message}}`, and swallows internals in prod.

### H-20 — PostgREST `.or()` filter strings don't escape comma/paren — possible filter injection
- **File**: `src/lib/supabase/queries.ts:605, 611, 631, 638, 791-828`
- **Category**: SQLi (PostgREST filter injection)
- **Explanation**: `safe = trimmed.replace(/[%_]/g, '\\$&')` only escapes `%` and `_`. A user query containing `,` or `)` could inject additional OR clauses. Severity depends on PostgREST behaviour; treat as plausible.
- **Fix**: Strip `,()\\` before interpolating, or call `.ilike()` per-column rather than building one OR string.

### H-21 — `searchAllContent` lacks `is_locked` filter; combined with C-13 leaks paid content URLs
- **File**: `src/lib/supabase/queries.ts:830-866`
- **Category**: Data Leak
- **Fix**: Filter at the RLS layer (preferred — fix C-13). Add `.eq('is_locked', false)` for unauthenticated callers as defence-in-depth.

### H-22 — `/api/admin/cs/resources` GET / Server Actions use `getAdminSession` cookie that doesn't track role demotion in middleware
- **File**: `src/app/api/admin/cs/resources/route.ts:31, 59, 125`; tied to C-10 / Cookie staleness.
- **Category**: AuthZ — Stale Privilege
- **Fix**: See C-10. Re-derive `admin_subjects` / `admin_landing` from DB in middleware.

### H-23 — `student-login` does `auth.admin.listUsers({ perPage: 1000 })` to find email collisions
- **File**: `src/app/api/auth/student-login/route.ts:179, 204`
- **Category**: DoS
- **Explanation**: Comment says "with only 3 total users this is safe". As soon as you onboard students, every login retry lists all users — quadratic growth.
- **Fix**: Use `getUserByEmail` filter or `student_accounts.auth_user_id` mapping.

### H-24 — Migration prefix collisions `010_*` and `011_*`
- **File**: `supabase/migrations/010_add_is_locked_to_resources.sql` vs `010_cs_module_type_enum.sql`; `011_seed_science_categories.sql` vs `011_user_progress.sql`
- **Category**: Schema Stability
- **Fix**: Renumber to unique prefixes. Add `scripts/check-migrations.ts` asserting uniqueness; run in CI.

### H-25 — Seven root-level `*.sql` files are ungoverned schema patches
- **File**: `add_module_type.sql`, `add_question_mapping.sql`, `add_sort_order.sql`, `fix_resources.sql`, `fix_schema_mismatch.sql`, `refresh_fts_index.sql`, `seed_categories.sql`
- **Category**: Schema Stability
- **Fix**: Move column-altering ones into numbered migrations; delete the originals; gate seed scripts behind `IF NOT EXISTS` + env check.

### H-26 — Four overlapping subject "sources of truth"
- **File**: `src/config/subjects.ts:37-159`, `src/config/taxonomy.ts:77-205`, `src/config/admin-portals.ts:50-126`, `src/config/navigation.ts` (`subjectMeta`)
- **Category**: Modularity / Tech Debt
- **Fix**: Make `taxonomy.ts` canonical. Derive `ADMIN_PORTALS`, `subjectMeta`, `O_LEVEL_SUBJECTS` from it. Move colors to `src/config/colors.ts`.

### H-27 — `src/config/stem.ts` is 9,565 lines (inlined HTML payloads)
- **File**: `src/config/stem.ts`
- **Category**: Bundle Size / Build Time
- **Fix**: Move HTML to `public/stem/<id>.html` static assets. Config keeps only metadata.

### H-28 — `'use client'` modal instantiates Supabase from raw env vars (4× in one file)
- **File**: `src/app/admin/(dashboard)/resources/NewResourceModal.tsx:91, 123, 141, 161`
- **Category**: Modularity
- **Fix**: Use `createClient()` from `src/lib/supabase/client.ts`. Add an ESLint rule banning direct `@supabase/ssr`/`@supabase/supabase-js` imports outside `src/lib/supabase/*`.

### H-29 — `process.env.X!` everywhere; no env validation at boot
- **File**: 25+ sites (e.g. `src/middleware.ts:20-21`, `src/app/api/admin/login/route.ts:23-24`, every Supabase factory)
- **Category**: Build/Deploy / DX
- **Fix**: `src/lib/env.ts` with `zod` parsing `process.env` at module load. Replace every `process.env.X!` with `env.X`. Fail fast at `next build`.

### H-30 — Zero automated tests
- **Category**: Testing Gap
- **Fix**: Install `vitest`. First three tests: (a) `src/lib/admin/resolve-managed-subjects.ts`; (b) `getCategoriesBySubjectSlug` slug-aliasing path with mocked Supabase; (c) middleware admin-isolation table-driven. Wire `npm test` and CI gate.

### H-31 — `VideoCarousel` re-emits a `<style>` block in render — every hover re-creates the stylesheet
- **File**: `src/components/home/VideoCarousel.tsx:277`
- **Category**: Wasted Render
- **Fix**: Move `shimmerCSS` to `globals.css`.

### H-32 — `HomeClient` student-reviews RAF loop runs forever — no visibility / reduced-motion gate
- **File**: `src/components/home/HomeClient.tsx:685-698`
- **Category**: Memory Leak / Wasted Render
- **Fix**: Wrap in `IntersectionObserver` + `visibilitychange`; honour `useReducedMotion()`.

### H-33 — `Navbar` auth check causes guaranteed flicker on every public page
- **File**: `src/components/layout/Navbar.tsx:18-48, 177`
- **Category**: Hydration / UX
- **Fix**: Read user server-side in `RootLayout`; pass as initial prop to client `Navbar`.

### H-34 — `AskAnythingWidget` `onMove` listener depends on `size.w` only; `interacting` flag uses ref → never re-renders the iframe overlay
- **File**: `src/components/ui/AskAnythingWidget.tsx:370-396, 399`
- **Category**: Memory Leak / Stale Closure
- **Fix**: Single mount-time effect with refs for sizes; use state (not ref) for `interacting`.

### H-35 — `EmbeddedViewer` / `InteractiveSolver` overwrite `window.onYouTubeIframeAPIReady` instead of chaining
- **File**: `src/components/resources/EmbeddedViewer.tsx:82-92`, `InteractiveSolver.tsx:114-124`; cf. `MediaFrame.tsx:118-123` does chain.
- **Category**: Stale Closure / Memory Leak
- **Fix**: Centralize YT API loading in `src/lib/youtube-api.ts` returning a cached promise.

### H-36 — `app/layout.tsx` mounts `PlexusBackground` + `AskAnythingWidget` on every public route unconditionally
- **File**: `src/app/layout.tsx:13-14, 82-89`
- **Category**: Bundle Size
- **Fix**: Defer `AskAnythingWidget` to first idle + post-hero scroll; replace `<motion.*>` floating-card animations with CSS keyframes.

---

## §5 — Medium Findings

> Truncated to highlights — full agent reports retained in this codebase's memory; ask for any sub-section in detail.

| ID | File:Line | Category | One-line |
|---|---|---|---|
| M-01 | `src/app/api/pdf/[id]/route.ts:179-211` | IDOR | Locked PDFs accessible to *any* signed-in student regardless of subject/subscription scope. |
| M-02 | `src/app/api/pdf/[id]/route.ts:316-351` | DoS | Range header parsing fully buffers the PDF in memory; coordinated downloads exhaust serverless RAM. |
| M-03 | `src/app/api/auth/student-login/route.ts:54, 116, 121, 133, 199` | PII in Logs | Emails logged on every login path. |
| M-04 | `src/app/api/subscribers/route.ts:9-32` | Validation | `level`/`sourcePage` written verbatim, no enum/length caps. |
| M-05 | `src/app/api/progress/update/route.ts:7-30` | Validation | `watchTime` unbounded; `resourceId` not verified to exist. |
| M-06 | `src/app/api/subjects/counts/route.ts:9-21` | Validation | Slug shape not validated. |
| M-07 | `supabase/migrations/011_user_progress.sql:23-24` | RLS | `FOR ALL` policy lacks `WITH CHECK`; students can INSERT rows for others (UNIQUE saves it for now). |
| M-08 | `supabase/migrations/008_create_users_and_blog.sql:16` | Schema | `users` table half-deprecated alongside `student_accounts`; `is_admin()` only checks the latter. |
| M-09 | `supabase/migrations/016_fix_category_subject_fk.sql:19-32` | Schema | Drop+remap+re-add FK without orphan-row assertion → silent invalid data. |
| M-10 | `supabase/migrations/20260422_enforce_resource_integrity.sql:24-58` | Schema | `enforce_resource_category_identity` *silently rewrites* mismatched `subject_id`/`syllabus_id` instead of erroring. |
| M-11 | `supabase/migrations/013_digital_skills.sql:101-105` | RLS | `skill_lessons` / `skill_playlists` SELECT is `USING (true)` — every lesson URL/note URL public regardless of `is_free` or paid access. |
| M-12 | RLS-wide | Documentation | Several tables (`topics`, `subject_papers`) are public-read with no INSERT/UPDATE/DELETE policies — admin writes go via service-role; document explicitly. |
| M-13 | `src/app/admin/super/actions.ts:40-73` | Validation | `assignSubjectToAdmin` does not verify target `role === 'admin'` — orphans `managed_subjects` on student rows. |
| M-14 | `src/app/admin/super/actions.ts:75-98` | UX | `removeSubjectFromAdmin` permits stripping the last subject, locking the admin out silently. |
| M-15 | `src/app/admin/(dashboard)/categories/CategoryTableClient.tsx:163-168`; `actions.ts:487-528` | Atomicity | Cascade category delete is `update + delete` in two non-transactional calls. |
| M-16 | `src/app/admin/(dashboard)/students/StudentsClient.tsx:88-95, 322` | Info Disclosure | New password rendered inline in DOM; never auto-cleared. |
| M-17 | `src/app/admin/forbidden/page.tsx`; `src/middleware.ts:107-132` | Enumeration | 403 vs 404 differential reveals which portals exist. |
| M-18 | `src/app/admin/(dashboard)/resources/BulkUploadPreview.tsx:24-43, 99-101` | UX/Perf | `JSON.parse` runs three times including in JSX render. |
| M-19 | `src/components/ui/ThemeProvider.tsx:48` | Hydration | Returns `<>{children}</>` un-wrapped before mount; `useTheme()` consumers see default during hydration. |
| M-20 | `src/components/resources/UnifiedModuleGrid.tsx:306`, `ResourceCard.tsx:38`, `MediaFrame.tsx:73` | Hydration | `document.cookie.includes('admin_mode=1')` read in render → SSR/CSR drift. |
| M-21 | `src/components/home/HomeClient.tsx:880-885` and similar | Wasted Render | Hero rotators run `setInterval` forever, no visibility/reduced-motion gate. (Pattern repeated in `DigitalSkillsClient`, `TutorsDiscoveryClient`, `DashboardClient`.) |
| M-22 | `src/components/ui/AnimatedCounter.tsx:81-83` | Hydration | `window.matchMedia` read at render time. |
| M-23 | `src/components/resources/InteractiveSolver.tsx:84-91`, `EmbeddedViewer.tsx:51-59` | Stale Closure | `progressUpdateRef` dedup is per-mount; periodic `updateProgress(false)` runs once and never again — silently breaks watch-time accumulation. |
| M-24 | `src/components/digital-skills/TrendingRow.tsx:52-64` | Wasted Render | Effect deps include `trending` array reference; SWR refetch re-binds scroll listener every time. |
| M-25 | `src/components/resources/PDFViewerLayout.tsx:50` | UX | `requestFullscreen()` no error handling, no Safari prefix. |
| M-26 | `src/app/auth/login/page.tsx:40` | UX | `window.location.href` instead of `router.push + router.refresh`. |
| M-27 | `src/lib/supabase/queries.ts` (entire file) | Modularity | 1,039 lines mixing 8 entities; impossible to test per-entity. |
| M-28 | `src/middleware.ts:88-134`; `src/app/api/admin/login/route.ts:70-134` | Modularity | 4-cookie admin state with no single source of truth. |
| M-29 | `tsconfig.json` | Type Safety | `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` not enabled. |
| M-30 | `.eslintrc.json` | DX | Bare `next/core-web-vitals`; `as any` and `as unknown as` go unflagged. |
| M-31 | `package.json:5-12` | Build/Deploy | No `typecheck` script, no `prebuild` hook, no test runner. |
| M-32 | 78 sites | Logging | Pure `console.*`; no structured logger, no PII redaction, no request correlation. |
| M-33 | `src/lib/supabase/queries.ts` (`unstable_cache` use) | Caching | Closures inside exported functions defeat memoization on Next 14. |
| M-34 | `src/lib/useSubjectCounts.ts` | Modularity | Hook misplaced in `lib/` instead of `hooks/`. |
| M-35 | `src/components/ResourceTypeSelector.tsx`, `src/components/SubjectCard.tsx` | Modularity | Two components orphaned at top of `components/`. |
| M-36 | `src/lib/db-init.ts`, `init-subject.ts`, `db/subject-provisioner.ts` | Modularity | Three modules with overlapping subject-bootstrap logic. |
| M-37 | 88 of 223 files | Scalability | 40% of files are `'use client'`; large `*Client.tsx` defeat RSC. |
| M-38 | `src/app/admin/maths/page.tsx` | Tech Debt | Stub-redirect alias; should live in `next.config.js`. |

---

## §6 — Low Findings

| ID | File:Line | One-line |
|---|---|---|
| L-01 | `src/app/auth/signup/page.tsx:13-18` | Signup is a stub — `setTimeout` then no-op. |
| L-02 | `src/components/ui/AnimatedCounter.tsx:161` | `eslint-disable-next-line react-hooks/exhaustive-deps` masks a stable-closure assumption. |
| L-03 | `src/components/home/VideoCarousel.tsx:65-72, 258, 325-329` | `MarqueeCard` uses state for `hovered`; CSS `:hover` would be free. Doubled item array re-renders 40 cards. |
| L-04 | `src/components/ui/WhatsAppFloat.tsx:19-21` | `<button onClick={window.open}>` should be `<a target="_blank">`. |
| L-05 | `src/app/digital-skills/DigitalSkillsClient.tsx:823-832, 950, 959` | Anchor `href="#skills"` races with `router.replace + scrollTo` from nav listener. |
| L-06 | `src/components/resources/ResourceCard.tsx:47` | Stagger animation ignores `useReducedMotion()`. |
| L-07 | `src/components/layout/Footer.tsx:122` | `new Date().getFullYear()` in render of a client component. |
| L-08 | `src/app/admin/super/SuperAdminClient.tsx:163-166, 296-303` | Auto-slug regen overwrites user edits. |
| L-09 | `src/components/admin/SubjectSwitcher.tsx:108-110` | `router.push` without follow-up `router.refresh()`. |
| L-10 | `src/app/admin/super/SuperAdminClient.tsx:457-537` | "Add" with no selection silently no-ops. |
| L-11 | `refresh_fts_index.sql:15` | `REINDEX INDEX resources_fts_idx` — index is named `idx_resources_fts_col`. |
| L-12 | `supabase/migrations/005_create_resources.sql:6-7`, `008_create_users_and_blog.sql:7, 11` | `CREATE TYPE IF NOT EXISTS` is not portable; use a `DO`-block guard. |
| L-13 | `supabase/migrations/20260407_rls_ensure_public_reads.sql:75-83` | `resource_views.resource_id` is nullable. |
| L-14 | `supabase/migrations/003_create_categories.sql:13` vs `seed_categories.sql:33` | `parent_id ON DELETE SET NULL` (migration) vs `CASCADE` (seed). Production state indeterminate. |
| L-15 | `supabase/storage/cors.json:3` | Bucket CORS = `["*"]`; per-bucket override needed if private buckets are added. |
| L-16 | `supabase/migrations/020260417_resource_subject_integrity.sql` and onward | No CHECK on `student_accounts.role`; free-form TEXT. Use ENUM + CHECK. |
| L-17 | `supabase/migrations/008_create_users_and_blog.sql:16` | `tutor_applications.reviewed_by` FK still points at `users(id)` — half-deprecated table. |
| L-18 | `supabase/migrations/006_create_resource_solutions.sql` | No type-discrimination CHECK between `paper_id` and `video_id`. |

---

## §7 — Inventory: Tables × RLS Posture

| Table | RLS | Public SELECT | Public INSERT | Owner col | Issue |
|---|---|---|---|---|---|
| `levels` | Y | `true` | — | — | OK |
| `subjects` | Y | `true` | super-admin | — | OK |
| `subject_papers` | Y | `true` | service-role only | — | OK (no admin policy — see M-12) |
| `categories` | Y | `true` | `is_admin()` (no subject scope) | `subject_id` | **H-11** |
| `exam_series` | Y | `true` | — | — | OK |
| `topics` | Y | `true` | — | — | OK (document) |
| `syllabi` | Y | `true` | — | — | OK |
| `resources` | Y | `is_published=true` (lock guard lost) | admin scoped | `subject_id` | **C-13** |
| `resource_solutions` | Y | `true` (leaks unpublished) | — | `paper_id` | **H-10** |
| `subscribers` | Y | dead policy | `WITH CHECK (true)` | — | **H-08, H-09** |
| `users` | Y | self + dead admin | — | `id` | M-08 |
| `student_accounts` | Y (in prod, **not in repo**) | self (incl. password_hash!) | — | `id` | **C-11, C-12** |
| `tutor_applications` | Y | dead admin policy | `WITH CHECK (true)` | `reviewed_by` | **H-08, H-09** |
| `tutors` | Y | `is_verified=true` | — | — | OK (intentional public catalog) |
| `blog_posts` | Y | `is_published=true` | — | `author_id` | OK |
| `demo_bookings` | unknown — table not in repo | unknown | unknown | — | **C-12** |
| `media_widgets` | unknown — table not in repo | unknown | unknown | — | **C-12** |
| `user_progress` | Y | self | self (FOR ALL — no WITH CHECK) | `user_id` | M-07 |
| `skills` | Y | `is_active=true` | — | — | OK |
| `skill_playlists` | Y | `true` | — | — | M-11 |
| `skill_lessons` | Y | `true` (no `is_free` gate) | — | — | M-11 |
| `student_skill_access` | Y | self | — | `student_id` | OK (admin via service-role) |
| `skill_playlist_views` | Y | `true` (anon!) | `WITH CHECK (true)` | `student_id` | **H-07** |
| `resource_views` | Y | `TO authenticated USING (true)` | `WITH CHECK (true)` | `resource_id` | **H-07** |
| `stem_simulations` | Y | `status='published'` (leaks `html_code`) | — | — | **H-12** |

---

## §8 — Folder Structure (annotated)

```
src/
├── app/                                      Next.js App Router
│   ├── admin/[subject]/                       Dynamic — overlaps with admin/cs, admin/maths
│   ├── admin/cs|maths|stem|...                Per-discipline portals (math vs maths alias drift — L-and-M-38)
│   ├── admin/(dashboard)/                     Cross-portal shared admin (resources, blog, students, ...)
│   ├── admin/super/                           Super-admin actions — most are unguarded (C-02..C-04, C-07)
│   ├── api/                                   Route handlers — no shared error/log middleware (H-19)
│   │   └── revalidate/                        Webhook (secret-in-URL: H-02)
│   ├── alevel/, olevel/, pre-olevel/          Public portals
│   ├── stem/, digital-skills/, tutors/        Adjacent product surfaces
│   ├── auth/, dashboard/, search/, view/      Student-side
│   └── blog/, contact/, demo/                 Static-ish
├── components/
│   ├── ResourceTypeSelector.tsx ⚠ orphan
│   ├── SubjectCard.tsx ⚠ orphan
│   └── admin/, home/, resources/, ui/, ...    Properly grouped
├── config/                                    ⚠ Four overlapping subject sources of truth (H-26)
│   ├── stem.ts                                ⚠ 9,565 lines (H-27)
│   └── subjects.ts, taxonomy.ts, admin-portals.ts, navigation.ts
├── hooks/                                     ⚠ Only useViewTracking.ts; one hook misplaced
├── lib/                                       ⚠ Kitchen sink
│   ├── supabase/
│   │   ├── admin.ts, anon.ts, client.ts, server.ts   4 client factories ✓
│   │   ├── types.ts                                   ⚠ Hand-written, drifted (C-17)
│   │   ├── queries.ts                                 ⚠ 1,039 lines mixing 8 entities (M-27)
│   │   └── guards.ts                                  Server-side admin gates ✓
│   ├── admin/                                 RBAC helpers ✓
│   ├── init-subject.ts ⚠ legacy (M-36)
│   ├── useSubjectCounts.ts ⚠ misplaced (M-34)
│   └── password.ts ⚠ unsalted SHA-256 (C-15)
├── types/
│   ├── index.ts ⚠ camelCase Resource — STALE shadow (C-17)
│   └── database.ts                            Tutors-only fragment
└── middleware.ts                              Auth + admin-isolation, 147 lines (C-09, C-10)
```

---

## §9 — Schema Stability Verdict

**The data model is coherent today** — but only because a trigger (`enforce_resource_category_identity` from `supabase/migrations/20260422_enforce_resource_integrity.sql:24-58`) now derives `resources.subject_id` and `resources.syllabus_id` from `categories.*` on every write, and those columns are `NOT NULL` after migration `20260417_resource_subject_integrity.sql`. The five-day burst of repair migrations (April 17–22, 2026) shows the model was iterated *in production*, fixed forward, not redesigned.

**Residual risks**:
1. Duplicate-prefixed migrations 010/011 mean ordering on a fresh DB depends on filesystem sort (H-24).
2. Seven root-level `*.sql` patches are out-of-band; a new environment will skip them and have a broken schema (H-25).
3. Some repair migrations use heuristic title matching (`title ILIKE '%Paper%'`) that mis-tags content; the migration files even acknowledge this and ship anyway.
4. `student_accounts` / `demo_bookings` / `media_widgets` exist in prod but not in any repo migration (C-12).
5. Three overlapping subject hierarchies (`subjects`, `subject_papers`, `syllabi`) make every join dance through `subject_papers!inner` for legacy reasons (`queries.ts:84`).

The trigger holds the line going forward. The model should be flattened (remove `syllabi.tier_id`; align slugs) before the 9th subject is added.

---

## §10 — Honest Architectural Verdict

ExamStitch is a **1.0-product solo-dev codebase that out-grew its skeleton**. Good intent exists everywhere — typed Supabase clients, a central `constants.ts`, `unstable_cache` discipline, a written `BLUEPRINT.md`, and a sophisticated trigger-based identity guard for `resources` — but enforcement is uneven. The four overlapping subject "sources of truth" (`subjects.ts`/`taxonomy.ts`/`admin-portals.ts`/`navigation.ts`), the duplicate `Resource` type in two casings, the seven unmanaged root-level `*.sql` patches, the duplicate-prefixed migrations, the absence of automated tests, the 9,565-line `stem.ts`, and the systematic missing auth on Server Actions and `/api/admin/students` together signal a codebase steered by short-cycle production fires rather than architectural intent.

**The bones are good** — App Router structure, RLS posture *in places*, the per-environment admin/anon/server client split, the `unstable_cache` strategy, and the trigger guardrail are real assets. Scaling this past 8 subjects, multi-tutor (Phase 2), or onboarding a second engineer requires:

1. Patching the 17 Critical findings in §3 in week 1 (they're mostly XS/S effort each).
2. Adding env validation, the first vitest suite, and a CI gate in week 2 (M effort).
3. Generating types from Supabase and deleting `src/types/index.ts` in week 3 (M effort).
4. Consolidating the four subject sources of truth in week 4 (M effort).
5. Splitting `queries.ts` and `stem.ts` in week 5 (S–M effort).

Without these, the next "repair migration" will arrive on schedule, and the next critical disclosure will arrive shortly after.

---

## §11 — Audit Methodology Notes

This report was produced by five independent specialist passes operating in parallel against the same source tree:

1. **Phase 1A — API & Auth Integrity**: 30 findings.
2. **Phase 1B — RLS, Schema, SQL injection**: 36 findings.
3. **Phase 2 — Admin panel state & logic**: 28 findings.
4. **Phase 3A — Frontend hooks, rendering, hydration**: 27 findings.
5. **Phase 3B — Architecture, modularity, tech debt**: 25 findings.

Total ≈ 146 raw findings before deduplication. Cross-cutting issues (e.g., admin_subjects cookie staleness identified by both API-auth and admin-logic passes; `is_locked` bypass identified by both API-auth and RLS passes) have been merged into single entries above and reflect the full evidence chain.

Where two passes produced conflicting severity assessments, the higher severity was retained. Where a finding was speculative without code evidence, it was dropped.

— End of report —
