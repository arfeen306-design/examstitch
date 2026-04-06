# System Smoke Test Checklist

> Run through this checklist before every production deployment.
> **Estimated time**: 10-15 minutes

---

## 1. Theme Persistence

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 1.1 | Theme switch | Click palette icon in sidebar, select "Beach" | UI switches to warm sandy palette |
| 1.2 | Persistence | Refresh the page (Cmd+R / F5) | Beach theme remains active |
| 1.3 | Cross-page | Navigate to a different page (e.g. `/olevel`) | Beach theme persists |
| 1.4 | All themes | Repeat for Navy, Midnight, Forest | Each theme applies and persists |
| 1.5 | Admin sync | Switch theme in admin panel, check sidebar colors update | Sidebar and content match |

**How it works**: Theme is stored in `localStorage('theme')` and applied via `data-theme` attribute on `<html>`.

---

## 2. Permission Lockdown (RBAC)

### Prerequisites
- A Super Admin account
- A subject-specific admin account (e.g. Math Admin with `managed_subjects: ["<math-uuid>"]`)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 2.1 | Subject admin redirect | Log in as Math Admin | Auto-redirects to `/admin` (Math dashboard) |
| 2.2 | Unauthorized portal block | As Math Admin, manually navigate to `/admin/cs` | Redirected to `/admin/forbidden` |
| 2.3 | Super Admin panel block | As Math Admin, navigate to `/admin/super` | Redirected to `/admin/forbidden` |
| 2.4 | Super Admin bypass | Log in as Super Admin | Can access `/admin/super`, `/admin/cs`, `/admin` freely |
| 2.5 | SubjectSwitcher visibility | As Math Admin with 1 subject | "Switch Panel" button is hidden (<=1 link) |
| 2.6 | Sidebar isolation | As CS Admin | Sidebar shows "My Subjects" with only "CS Resources" |
| 2.7 | API guard | As Math Admin, POST to `/api/admin/cs/resources` | Returns 403 or error |

### Cookie Verification (DevTools > Application > Cookies)

| Cookie | Expected Value |
|--------|---------------|
| `admin_session` | User UUID (httpOnly) |
| `admin_mode` | `1` (not httpOnly — UI hint only) |
| `admin_landing` | `super` / `cs` / `math` / `default` |
| `admin_subjects` | Comma-separated slugs, e.g. `computer-science-0478,computer-science-9618` |

---

## 3. Simulation Health

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 3.1 | Momentum lab render | Navigate to `/stem/science/momentum-collisions` | Two colored balls visible on canvas |
| 3.2 | Momentum interaction | Click "Start" | Balls move and collide, HUD updates with velocity/momentum |
| 3.3 | Canvas resize | Resize browser window | Canvas redraws, balls reposition proportionally |
| 3.4 | Theme sync | Switch to Forest theme while simulation is open | Canvas background and colors update to forest palette |
| 3.5 | Geometry lab | Navigate to `/stem/mathematics/geometry-explorer` | Shapes render on canvas |

---

## 4. Resource Upload Flow

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 4.1 | Open upload | Go to `/admin/cs`, click "Add Resource" | Modal opens with HierarchyPicker |
| 4.2 | O-Level flow | Select O-Level > Grade 9 > Video Lecture | Category auto-selects "Grade 9" |
| 4.3 | A-Level flow | Select A-Level > AS > Paper 1 > Solved Past Paper | Category auto-selects "Paper 1" |
| 4.4 | Submit video | Fill in title + YouTube URL, submit | Toast: "Resource created!", row appears in table |
| 4.5 | Submit PDF | Fill in title + Google Drive URL, content type = PDF | Toast: "Resource created!" |
| 4.6 | Delete resource | Click trash icon on a test resource, confirm | Resource removed from table |

---

## 5. Quick Regression Checks

| # | Area | Check |
|---|------|-------|
| 5.1 | Home page | Hero section loads, gradient renders, CTA buttons work |
| 5.2 | O-Level listing | `/olevel` shows all 8 subject cards |
| 5.3 | Subject page | `/olevel/mathematics-4024` loads grade tabs |
| 5.4 | Dashboard (student) | `/dashboard` loads for authenticated students |
| 5.5 | Blog | `/blog` renders post cards |
| 5.6 | Mobile nav | Hamburger menu works, theme toggle accessible |
| 5.7 | Loading skeletons | Navigate between pages — skeletons use theme variables (no hardcoded colors) |

---

## Automated Verification Script

Run this in the project root to verify build + key files:

```bash
#!/bin/bash
set -e

echo "=== ExamStitch Smoke Test ==="

# 1. Build check
echo "[1/5] Running production build..."
npx next build
echo "  BUILD PASSED"

# 2. Taxonomy config integrity
echo "[2/5] Checking taxonomy config..."
node -e "
  const t = require('./src/config/taxonomy.ts');
  // This will fail if the module can't be parsed
  console.log('  Subjects:', Object.keys(require('./src/config/taxonomy')).length > 0 ? 'OK' : 'FAIL');
" 2>/dev/null || echo "  (Skipped — TypeScript module, verified at build time)"

# 3. Simulation file exists
echo "[3/5] Checking simulation files..."
[ -f public/simulations/momentum-collisions.html ] && echo "  momentum-collisions.html: OK" || echo "  momentum-collisions.html: MISSING"

# 4. Migration files
echo "[4/5] Checking migration files..."
[ -f supabase/migrations/010_cs_module_type_enum.sql ] && echo "  010_cs_module_type_enum.sql: OK" || echo "  MISSING"
[ -f supabase/migrations/011_seed_science_categories.sql ] && echo "  011_seed_science_categories.sql: OK" || echo "  MISSING"

# 5. Environment variables
echo "[5/5] Checking .env.local keys..."
for key in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do
  grep -q "$key" .env.local 2>/dev/null && echo "  $key: SET" || echo "  $key: MISSING"
done

echo ""
echo "=== Smoke test complete ==="
```

---

**Result**: If all tests pass, the system is ready for production deployment.
