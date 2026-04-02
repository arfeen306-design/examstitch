# ExamStitch

A multi-subject educational platform for Cambridge exam preparation — past papers, video lectures, topical worksheets, and an interactive solver.

**Stack:** Next.js 14 · TypeScript · Supabase · Tailwind CSS · Vercel

---

## Architecture

```
src/
├── app/
│   ├── admin/                     # Admin dashboards
│   │   ├── (dashboard)/           # Maths admin (Navy/Gold theme)
│   │   ├── cs/                    # CS admin (Indigo theme)
│   │   ├── super/                 # Super admin control center
│   │   ├── forbidden/             # 403 page
│   │   └── login/                 # Shared login
│   ├── api/admin/                 # API routes
│   │   ├── cs/resources/          # CS-scoped CRUD
│   │   ├── super/                 # Super admin endpoints
│   │   └── login/                 # Auth endpoint
│   ├── olevel/ & alevel/          # Public resource pages
│   └── dashboard/                 # Student dashboard
├── lib/supabase/
│   ├── guards.ts                  # RBAC: getAdminSession, requireSubjectAdmin, requireSuperAdmin
│   ├── admin.ts                   # Service-role client (bypasses RLS)
│   ├── queries.ts                 # Cached query helpers
│   └── types.ts                   # Database types
└── components/admin/
    └── SubjectSwitcher.tsx        # Super-admin subject navigation
```

## Multi-Subject System

The platform supports multiple Cambridge subjects with role-based isolation:

| Role | Access | Landing Page |
|------|--------|-------------|
| Super Admin | All subjects + global management | `/admin/super` |
| CS Admin | Computer Science resources only | `/admin/cs` |
| Maths Admin | Mathematics resources only | `/admin` |

### Database Schema

- **`subjects`** — Top-level subjects (name, slug, allowed levels[])
- **`resources.subject_id`** — FK to subjects, ensures every resource belongs to one subject
- **`student_accounts.managed_subjects`** — UUID array of accessible subjects per admin
- **`student_accounts.is_super_admin`** — Boolean bypass for all subject checks

### Auth Flow

1. User submits credentials → `POST /api/admin/login`
2. Supabase Auth validates → service-role checks `student_accounts.role = 'admin'`
3. Sets `admin_session` cookie (user ID) + `admin_landing` cookie (role indicator)
4. Client redirects to role-appropriate dashboard
5. Middleware enforces subject isolation on every request

---

## Adding a New Subject (e.g., Physics)

**Time: ~5 minutes using the Super Admin UI.**

### Step 1: Create the Subject

1. Log in as super admin → `/admin/super`
2. Open the **Subject Factory** tab
3. Fill in:
   - **Name:** `Physics`
   - **Slug:** `physics` (auto-generated)
   - **Levels:** Select `O Level` and `A Level`
4. Click **Create Subject**

### Step 2: Assign an Admin

1. In the **Admin Manager** tab, find the teacher's account
2. Click **Assign** → select **Physics** from the dropdown
3. The teacher now has access to Physics resources only

### Step 3: Create the Dashboard Route (Developer)

```bash
# Copy the CS template
cp -r src/app/admin/cs src/app/admin/physics
```

Update `src/app/admin/physics/layout.tsx`:
- Change sidebar title to "Physics Admin"
- Update theme colors (e.g., emerald for Physics)
- Change the slug lookup from `'computer-science'` to `'physics'`

Update `src/app/admin/physics/page.tsx`:
- Change `.eq('slug', 'computer-science')` to `.eq('slug', 'physics')`

Update `src/app/admin/physics/actions.ts`:
- Change the slug from `'computer-science'` to `'physics'`

### Step 4: Register the Route

Add the new route to `src/components/admin/SubjectSwitcher.tsx`:
```ts
{ name: 'Physics Admin', slug: 'physics', href: '/admin/physics', icon: Atom, color: 'text-emerald-500' },
```

Update middleware subject isolation if needed. Build and deploy.

---

## Development

```bash
npm install
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run lint         # ESLint
```

### Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Database Migrations

Migrations are in `supabase/migrations/`. Apply with:

```bash
npx supabase db push --linked
```

---

## Deployment

Deployed on Vercel at [examstitch.com](https://www.examstitch.com).

```bash
npx vercel --prod    # Deploy to production
```
