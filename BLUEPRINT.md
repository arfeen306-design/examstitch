# ExamStitch.com - Complete Project Blueprint

**Project Name:** ExamStitch
**Domain:** examstitch.com
**Owner:** Zain (Mathematics Teacher - O-Level & A-Level)
**Created:** 2026-03-28
**Last Updated:** 2026-03-28 (v2 - Strategic Improvements Applied)
**Status:** Phase 1 - Planning & Foundation

---

## 1. Project Vision

ExamStitch is a free, public educational platform focused on O-Level (IGCSE) and A-Level Mathematics. It serves as a centralized hub where students can access video lectures, past papers, topical worksheets, and PDF resources — all organized by grade, level, paper, and topic.

**Phase 1:** Public resource hub for Mathematics (no login required) + silent lead generation.
**Phase 2:** Multi-teacher marketplace with tutor registration and student enrollment.

---

## 2. Content Organization (Site Map)

### SEO-Optimized URL Structure

URLs include Cambridge subject codes and topic names for maximum Google discoverability.
Students search for "O Level Maths 4024 Topical Worksheets" or "9709 Pure Maths Paper 1" — our URLs match those queries exactly.

```
examstitch.com/
|
|-- Home (Landing Page)
|-- About
|-- Contact
|
|-- /pre-olevel/
|   |-- (Foundational content for junior students)
|
|-- /olevel/  (O-Level / IGCSE)
|   |-- /mathematics-4024/                    # Subject code in URL for SEO
|   |   |-- /grade-9/
|   |   |   |-- /video-lectures/
|   |   |   |-- /past-papers/
|   |   |   |   |-- /may-june-2024-paper-1-v1/   # Individual paper page
|   |   |   |-- /topical/                        # Topical section
|   |   |       |-- /trigonometry/               # Topic-specific pages
|   |   |       |-- /algebra/
|   |   |       |-- /geometry/
|   |   |
|   |   |-- /grade-10/
|   |   |   |-- (same structure as grade-9)
|   |   |
|   |   |-- /grade-11/
|   |       |-- (same structure as grade-9)
|   |
|   |-- /additional-mathematics-4037/          # Future: Additional Maths
|       |-- (same grade structure)
|
|-- /alevel/  (A-Level)
|   |-- /mathematics-9709/                     # CIE subject code in URL
|   |   |-- /as-level/
|   |   |   |-- /paper-1-pure-mathematics/     # Descriptive slug for SEO
|   |   |   |   |-- /video-lectures/
|   |   |   |   |-- /past-papers/
|   |   |   |   |   |-- /may-june-2024-p1-v1/  # Individual paper page
|   |   |   |   |-- /topical/
|   |   |   |       |-- /differentiation/
|   |   |   |       |-- /integration/
|   |   |   |       |-- /vectors/
|   |   |   |
|   |   |   |-- /paper-2-probability-statistics/
|   |   |       |-- (same structure)
|   |   |
|   |   |-- /a2-level/
|   |       |-- /paper-3-pure-mathematics/
|   |       |   |-- (same structure)
|   |       |
|   |       |-- /paper-4-mechanics/
|   |           |-- (same structure)
|
|-- /blog/  (Educational articles, tips, exam strategies)
|
|-- /join-as-tutor/  (Google Form or internal form - Phase 2)
|-- /enroll/  (Student enrollment - Phase 2)
|
|-- /auth/  (Hidden routes - built but not exposed on frontend)
|   |-- /login
|   |-- /signup
|   |-- /admin  (Admin dashboard for Zain)
```

---

## 3. How Things Will Work

### 3A. Video Lectures (YouTube Integration)

- All video lectures are uploaded to YouTube (Public or Unlisted).
- On ExamStitch, each video page embeds the YouTube player.
- **Why YouTube?** Zero bandwidth cost, free CDN, mobile-friendly player, no storage fees.
- Each video entry in the database stores: YouTube video ID, title, description, topic, grade/level.
- Students click a video card -> video plays embedded on the site (or option to watch on YouTube).

### 3B. PDF Files (Custom Viewer + Google Drive Backend)

- All PDFs (past papers, worksheets, notes) are stored in Google Drive.
- Google Drive folders are organized to mirror the website structure.

**IMPORTANT: Custom PDF Wrapper (Not Raw Google Drive Links)**

We do NOT send students to the Google Drive UI. Instead, we use `@react-pdf-viewer/core` to render PDFs directly inside ExamStitch. The file is technically pulled from Google Drive, but the student never leaves the site.

**Why a custom wrapper?**
- Raw Google Drive links feel "off-brand" and sometimes prompt users to sign in to Google.
- A custom viewer keeps students on examstitch.com (better analytics, better brand experience).
- We can overlay our own branded toolbar with Print, Download, and Zoom controls.
- The viewer can show a "Video Solution" sidebar next to the paper (see Section 3G).

**How PDFs work for students:**
1. Student navigates to e.g. O-Level > Mathematics 4024 > Grade 10 > Past Papers.
2. Sees a list/grid of available papers with year, session, variant.
3. Clicks "View Paper" -> PDF renders inside a custom ExamStitch viewer on the same page.
4. **Custom Toolbar** overlaid on the viewer:
   - "Print" button -> triggers `window.print()` on the PDF content.
   - "Download" button -> direct download from Google Drive.
   - "Open in New Tab" -> opens PDF in a new browser tab.
   - "Zoom In / Zoom Out" controls.
   - "Video Solutions" button -> jumps to the linked video (see 3G).
5. **Alternatively**, student can right-click "Open in New Tab" to view in a separate window.

**Cost:** Free. Google Drive provides 15GB free, expandable with Google Workspace.

### 3C. Public Access (No Login Required - Phase 1)

- The entire site is publicly accessible.
- No sign-up or login buttons visible on the frontend.
- Students can browse all resources, watch videos, view/print/download PDFs freely.
- **However**, the authentication system is fully built in the backend (database tables, API routes, auth logic) — just not exposed in the UI.

### 3D. Authentication System (Built but Hidden)

- Full sign-up/login system is coded and ready.
- Database has users table with roles: `public`, `student`, `tutor_pending`, `tutor_verified`, `admin`.
- Auth routes exist at /auth/login and /auth/signup but are not linked from navigation.
- When ready to activate:
  - Toggle a config flag or environment variable.
  - Login/Signup buttons appear in the navbar.
  - Certain resources can be marked as "locked" (requires login to view).
- Admin panel at /admin for Zain to manage content, approve tutors, and toggle features.

### 3E. Resource Access Control (Future-Ready)

- Every resource in the database has an `is_locked` boolean field (default: `false`).
- When `is_locked = false`: Anyone can view.
- When `is_locked = true`: Only logged-in users can view. Others see a prompt to sign up.
- This allows gradual migration from fully public to partially gated content.

### 3F. Silent Lead Generation (Phase 1 - No Login Required)

Even without a login system visible, we capture interested users:

**"Notify Me" Email Box:**
- A small, non-intrusive email input appears on resource pages: "Get notified when new papers are uploaded."
- Emails are stored in a `subscribers` table in Supabase.
- Automated welcome email sent via **Resend** (free tier: 3,000 emails/month) or **Supabase Edge Functions**.
- This builds a marketing list for Phase 2 (Tutor Marketplace) launch without forcing a full signup.

**Why this matters:**
- In Phase 1, you have zero visibility into who your users are.
- This captures high-intent users (they actively want more content).
- When you launch Phase 2, you email this list: "We now have tutor profiles — sign up to connect with a teacher."
- Converts passive visitors into an owned audience.

### 3G. Paper-to-Video Direct Mapping (The Killer Feature)

**The Problem:** Students search for help on a specific question (e.g., "May/June 2024 Paper 12 Q5"). They don't want to watch an entire 45-minute video to find the 3 minutes they need.

**The Solution:** Every past paper in the database can link to a specific YouTube video + timestamp.

**How it works:**
1. When uploading a past paper, Zain also uploads the video solution for that paper.
2. The `resource_solutions` table maps: Paper ID -> Video ID + Timestamp (in seconds).
3. On the Past Paper viewer page, a **"Video Solutions" sidebar** appears next to the PDF.
4. The sidebar lists: "Q1 Solution (0:00)" | "Q2 Solution (3:45)" | "Q3 Solution (8:12)" ...
5. Student clicks "Q5 Solution" -> YouTube player jumps to that exact timestamp.
6. The PDF viewer and video player are side-by-side on desktop, stacked on mobile.

**Why this is a killer feature:**
- No other O/A-Level resource site does this well.
- It turns ExamStitch from "another past paper site" into "the site where I can get instant help."
- Students will bookmark and return because of this UX.
- It dramatically increases time-on-site (SEO benefit) and YouTube watch time (channel growth).

### 3H. PDF Watermarking (Brand Protection)

**The Problem:** Public PDFs get scraped and reposted on other sites without attribution.

**The Solution:** All custom-created content (topical worksheets, notes) gets watermarked before upload.

**Workflow:**
1. Zain creates a topical worksheet or compiled resource.
2. Before uploading to Google Drive, a watermark is applied: "Created by Zain - ExamStitch.com" on every page.
3. This can be done via a Python script (using `PyPDF2` or `reportlab`) or manually in the PDF editor.
4. Even if a student prints, screenshots, or shares the file — ExamStitch branding travels with it.

**Note:** Official Cambridge past papers should NOT be watermarked (they are not Zain's IP). Only watermark original content.

---

## 4. Technical Stack

| Component        | Technology              | Why This Choice                                           |
|------------------|-------------------------|-----------------------------------------------------------|
| **Framework**    | **Next.js 14 (React)**  | SEO-friendly (critical for educational content), fast SSR/SSG, API routes built-in |
| **Language**     | **TypeScript**          | Type safety, better developer experience, fewer bugs      |
| **Styling**      | **Tailwind CSS**        | Rapid UI development, responsive design, professional look |
| **UI Components**| **shadcn/ui**           | Pre-built accessible components, consistent design        |
| **Database**     | **Supabase (PostgreSQL)** | Free tier, built-in auth, real-time capabilities, REST API |
| **Auth**         | **Supabase Auth**       | Ready-made auth with email/password, Google OAuth, magic links |
| **File Storage** | **Google Drive API**    | Zero cost for PDF storage, familiar for teachers          |
| **PDF Viewer**   | **@react-pdf-viewer/core** | Custom branded viewer, keeps users on-site, print/download toolbar |
| **Video**        | **YouTube Embed API**   | Zero bandwidth cost, free hosting, professional player    |
| **Email**        | **Resend**              | Free tier (3K/month), for "notify me" subscriber emails   |
| **Deployment**   | **Vercel**              | Free tier, automatic deployments, edge network, perfect Next.js support |
| **Domain**       | **examstitch.com**      | Purchase from Namecheap/GoDaddy, point to Vercel          |
| **Analytics**    | **Google Analytics 4**  | Free, tracks student usage patterns                       |
| **Watermarking** | **Python (PyPDF2)**     | Offline script to watermark original content before upload |
| **Forms**        | **Google Forms (Phase 2)** or React Hook Form | Tutor registration, student enrollment |

### Why Next.js + Supabase?

- **Next.js** gives you server-side rendering which is critical for Google SEO (students searching for "A-Level Maths Past Papers" will find your site).
- **Supabase** provides a full PostgreSQL database + authentication + file storage on a generous free tier.
- **Total monthly cost in Phase 1:** $0 (free tiers of Vercel + Supabase + Google Drive + YouTube + Resend).
- **When scaling:** Vercel Pro ($20/mo) + Supabase Pro ($25/mo) = $45/mo for thousands of users.

---

## 5. Database Schema

### Table: `levels`
| Column      | Type    | Description                        |
|-------------|---------|------------------------------------|
| id          | UUID    | Primary key                        |
| name        | TEXT    | "Pre O-Level", "O-Level", "A-Level"|
| slug        | TEXT    | "pre-olevel", "olevel", "alevel"   |
| sort_order  | INT     | Display order                      |

### Table: `subjects`
| Column      | Type    | Description                                    |
|-------------|---------|------------------------------------------------|
| id          | UUID    | Primary key                                    |
| name        | TEXT    | "Mathematics", "Additional Mathematics"        |
| code        | TEXT    | "4024", "4037", "9709" (Cambridge subject code)|
| level_id    | UUID    | FK -> levels.id                                |
| slug        | TEXT    | "mathematics-4024", "mathematics-9709"         |
| sort_order  | INT     | Display order                                  |

### Table: `categories`
| Column      | Type    | Description                                      |
|-------------|---------|--------------------------------------------------|
| id          | UUID    | Primary key                                      |
| subject_id  | UUID    | FK -> subjects.id                                |
| name        | TEXT    | "Grade 9", "Grade 10", "AS Level Paper 1", etc. |
| slug        | TEXT    | "grade-9", "paper-1-pure-mathematics", etc.      |
| parent_id   | UUID    | Nullable FK -> categories.id (for nesting)       |
| sort_order  | INT     | Display order                                    |

### Table: `exam_series`
| Column      | Type    | Description                                    |
|-------------|---------|------------------------------------------------|
| id          | UUID    | Primary key                                    |
| subject_id  | UUID    | FK -> subjects.id                              |
| code        | TEXT    | "4024" (Cambridge subject code)                |
| year        | INT     | 2024                                           |
| session     | TEXT    | "May/June", "Oct/Nov", "Feb/Mar"               |
| variant     | INT     | 1, 2, or 3                                     |
| paper_number| INT     | 1, 2, 3, or 4                                  |

This table normalizes exam metadata so resources can reference a specific exam sitting cleanly.

### Table: `resources`
| Column          | Type      | Description                                    |
|-----------------|-----------|------------------------------------------------|
| id              | UUID      | Primary key                                    |
| category_id     | UUID      | FK -> categories.id                            |
| exam_series_id  | UUID      | Nullable FK -> exam_series.id (for past papers)|
| title           | TEXT      | "May/June 2024 Paper 1 Variant 1"             |
| description     | TEXT      | Optional description                           |
| content_type    | ENUM      | "video", "pdf", "worksheet"                   |
| source_type     | ENUM      | "youtube", "google_drive", "external_link"     |
| source_url      | TEXT      | YouTube video ID or Google Drive file ID/URL   |
| topic           | TEXT      | "Trigonometry", "Algebra" (for topical resources)|
| subject         | TEXT      | "Mathematics" (expandable for future subjects) |
| is_watermarked  | BOOLEAN   | Whether this is original content with watermark|
| is_locked       | BOOLEAN   | Default: false (public). True = requires login |
| is_published    | BOOLEAN   | Default: true. Admin can hide resources        |
| created_at      | TIMESTAMP | Auto-generated                                 |
| updated_at      | TIMESTAMP | Auto-generated                                 |
| uploaded_by     | UUID      | FK -> users.id (for multi-teacher Phase 2)     |

### Table: `resource_solutions` (Paper-to-Video Mapping)
| Column          | Type      | Description                                    |
|-----------------|-----------|------------------------------------------------|
| id              | UUID      | Primary key                                    |
| paper_id        | UUID      | FK -> resources.id (the past paper PDF)        |
| video_id        | UUID      | FK -> resources.id (the solution video)        |
| question_number | INT       | Which question (1, 2, 3...)                    |
| timestamp_seconds| INT      | YouTube timestamp in seconds (e.g., 225 = 3:45)|
| label           | TEXT      | "Q5 (a)(i)" or "Q3 - Differentiation"         |
| sort_order      | INT       | Display order in the sidebar                   |

This table is the backbone of the "Paper-to-Video Direct Mapping" killer feature.

### Table: `subscribers` (Silent Lead Generation)
| Column      | Type      | Description                                    |
|-------------|-----------|------------------------------------------------|
| id          | UUID      | Primary key                                    |
| email       | TEXT      | Subscriber email (unique)                      |
| source_page | TEXT      | Which page they subscribed from                |
| level       | TEXT      | "olevel", "alevel" (what they're interested in)|
| is_active   | BOOLEAN   | Can unsubscribe                                |
| created_at  | TIMESTAMP | Auto-generated                                 |

### Table: `users` (Built now, used later)
| Column      | Type      | Description                                    |
|-------------|-----------|------------------------------------------------|
| id          | UUID      | Primary key (from Supabase Auth)               |
| email       | TEXT      | User email                                     |
| full_name   | TEXT      | Display name                                   |
| role        | ENUM      | "admin", "tutor_verified", "tutor_pending", "student", "public" |
| avatar_url  | TEXT      | Profile picture URL                            |
| bio         | TEXT      | Teacher bio (for tutor profiles)               |
| subjects    | TEXT[]    | Array of subjects they teach                   |
| is_active   | BOOLEAN   | Account active status                          |
| created_at  | TIMESTAMP | Auto-generated                                 |

### Table: `tutor_applications` (Phase 2)
| Column        | Type      | Description                                  |
|---------------|-----------|----------------------------------------------|
| id            | UUID      | Primary key                                  |
| full_name     | TEXT      | Applicant name                               |
| email         | TEXT      | Contact email                                |
| phone         | TEXT      | Phone number                                 |
| subjects      | TEXT[]    | Subjects they can teach                      |
| qualifications| TEXT      | Education background                         |
| experience    | TEXT      | Teaching experience                          |
| status        | ENUM      | "pending", "approved", "rejected"            |
| reviewed_by   | UUID      | FK -> users.id (admin who reviewed)          |
| created_at    | TIMESTAMP | Auto-generated                               |

### Table: `blog_posts`
| Column      | Type      | Description                                    |
|-------------|-----------|------------------------------------------------|
| id          | UUID      | Primary key                                    |
| title       | TEXT      | Post title                                     |
| slug        | TEXT      | URL-friendly title                             |
| content     | TEXT      | Markdown or rich text content                  |
| author_id   | UUID      | FK -> users.id                                 |
| is_published| BOOLEAN   | Draft or published                             |
| created_at  | TIMESTAMP | Auto-generated                                 |
| updated_at  | TIMESTAMP | Auto-generated                                 |

---

## 6. Project Folder Structure

```
examstitch.com/
|-- src/
|   |-- app/                          # Next.js App Router
|   |   |-- layout.tsx                # Root layout (navbar, footer)
|   |   |-- page.tsx                  # Home page
|   |   |-- about/page.tsx
|   |   |-- contact/page.tsx
|   |   |
|   |   |-- pre-olevel/
|   |   |   |-- page.tsx              # Pre O-Level landing
|   |   |
|   |   |-- olevel/
|   |   |   |-- page.tsx              # O-Level landing (subject cards)
|   |   |   |-- [subject]/            # e.g., mathematics-4024
|   |   |       |-- page.tsx          # Subject landing (Grade 9, 10, 11 cards)
|   |   |       |-- [grade]/
|   |   |           |-- page.tsx      # Grade page (video, papers, worksheets tabs)
|   |   |           |-- video-lectures/page.tsx
|   |   |           |-- past-papers/
|   |   |           |   |-- page.tsx  # All past papers grid
|   |   |           |   |-- [paper-slug]/page.tsx  # Individual paper viewer + video sidebar
|   |   |           |-- topical/
|   |   |               |-- page.tsx  # All topics list
|   |   |               |-- [topic]/page.tsx  # e.g., /trigonometry
|   |   |
|   |   |-- alevel/
|   |   |   |-- page.tsx              # A-Level landing (subject cards)
|   |   |   |-- [subject]/            # e.g., mathematics-9709
|   |   |       |-- page.tsx
|   |   |       |-- as-level/
|   |   |       |   |-- page.tsx
|   |   |       |   |-- [paper]/      # e.g., paper-1-pure-mathematics
|   |   |       |       |-- page.tsx
|   |   |       |       |-- video-lectures/page.tsx
|   |   |       |       |-- past-papers/
|   |   |       |       |   |-- page.tsx
|   |   |       |       |   |-- [paper-slug]/page.tsx  # Paper viewer + video solutions
|   |   |       |       |-- topical/
|   |   |       |           |-- page.tsx
|   |   |       |           |-- [topic]/page.tsx
|   |   |       |-- a2-level/
|   |   |           |-- (same structure as as-level)
|   |   |
|   |   |-- blog/
|   |   |   |-- page.tsx              # Blog listing
|   |   |   |-- [slug]/page.tsx       # Individual blog post
|   |   |
|   |   |-- auth/                     # HIDDEN routes (built but not in nav)
|   |   |   |-- login/page.tsx
|   |   |   |-- signup/page.tsx
|   |   |
|   |   |-- admin/                    # Admin dashboard (protected)
|   |   |   |-- page.tsx
|   |   |   |-- resources/page.tsx    # Manage resources
|   |   |   |-- solutions/page.tsx    # Manage paper-to-video mappings
|   |   |   |-- tutors/page.tsx       # Approve/reject tutors
|   |   |   |-- subscribers/page.tsx  # View subscriber emails
|   |   |   |-- users/page.tsx        # Manage users
|   |   |
|   |   |-- api/                      # API routes
|   |       |-- resources/route.ts
|   |       |-- solutions/route.ts    # Paper-to-video mapping API
|   |       |-- subscribers/route.ts  # Email subscription API
|   |       |-- auth/route.ts
|   |
|   |-- components/
|   |   |-- layout/
|   |   |   |-- Navbar.tsx
|   |   |   |-- Footer.tsx
|   |   |   |-- Sidebar.tsx
|   |   |
|   |   |-- ui/                       # shadcn/ui components
|   |   |   |-- button.tsx
|   |   |   |-- card.tsx
|   |   |   |-- dialog.tsx
|   |   |   |-- input.tsx
|   |   |   |-- ...
|   |   |
|   |   |-- resources/
|   |   |   |-- ResourceCard.tsx      # Card showing a single resource
|   |   |   |-- ResourceGrid.tsx      # Grid of resource cards
|   |   |   |-- PDFViewer.tsx         # Custom branded PDF viewer (@react-pdf-viewer/core)
|   |   |   |-- PDFToolbar.tsx        # Print | Download | New Tab | Zoom controls
|   |   |   |-- VideoPlayer.tsx       # YouTube embed component with timestamp support
|   |   |   |-- VideoSolutionsSidebar.tsx  # Q1, Q2, Q3... solution links next to paper
|   |   |   |-- PaperViewerLayout.tsx     # Side-by-side PDF + Video layout
|   |   |
|   |   |-- lead-gen/
|   |   |   |-- NotifyMeBox.tsx       # "Get notified" email capture component
|   |   |   |-- SubscribeSuccess.tsx  # Thank you message after subscribing
|   |   |
|   |   |-- auth/
|   |   |   |-- LoginForm.tsx
|   |   |   |-- SignupForm.tsx
|   |   |   |-- AuthGuard.tsx         # Protects locked resources
|   |   |
|   |   |-- admin/
|   |       |-- ResourceManager.tsx
|   |       |-- SolutionMapper.tsx    # UI to map paper questions to video timestamps
|   |       |-- TutorApproval.tsx
|   |       |-- SubscriberList.tsx    # View/export subscriber emails
|   |
|   |-- lib/
|   |   |-- supabase/
|   |   |   |-- client.ts             # Supabase browser client
|   |   |   |-- server.ts             # Supabase server client
|   |   |   |-- admin.ts              # Supabase admin client
|   |   |
|   |   |-- google-drive.ts           # Google Drive API helpers
|   |   |-- youtube.ts                # YouTube embed helpers + timestamp utils
|   |   |-- email.ts                  # Resend email integration
|   |   |-- utils.ts                  # General utilities
|   |   |-- constants.ts              # Site-wide constants
|   |
|   |-- types/
|   |   |-- index.ts                  # TypeScript type definitions
|   |   |-- database.ts              # Supabase generated types
|   |
|   |-- config/
|       |-- site.ts                   # Site metadata, feature flags
|       |-- navigation.ts             # Nav menu structure
|       |-- features.ts               # Feature toggles (auth visible, etc.)
|
|-- scripts/
|   |-- watermark.py                  # Python script to watermark PDFs before upload
|   |-- requirements.txt              # PyPDF2, reportlab dependencies
|
|-- public/
|   |-- images/
|   |-- watermark-logo.png            # ExamStitch logo used in watermarks
|   |-- favicon.ico
|
|-- supabase/
|   |-- migrations/                   # SQL migration files
|   |   |-- 001_create_levels.sql
|   |   |-- 002_create_subjects.sql
|   |   |-- 003_create_categories.sql
|   |   |-- 004_create_exam_series.sql
|   |   |-- 005_create_resources.sql
|   |   |-- 006_create_resource_solutions.sql
|   |   |-- 007_create_subscribers.sql
|   |   |-- 008_create_users.sql
|   |   |-- 009_create_tutor_applications.sql
|   |   |-- 010_create_blog_posts.sql
|   |-- seed.sql                      # Initial data (levels, subjects, categories)
|
|-- .env.local                        # Environment variables (NEVER commit)
|-- .gitignore
|-- next.config.js
|-- tailwind.config.ts
|-- tsconfig.json
|-- package.json
|-- BLUEPRINT.md                      # This file
```

---

## 7. Feature Flags (Toggle System)

In `src/config/features.ts`:

```typescript
export const FEATURES = {
  AUTH_ENABLED: false,          // Toggle to show login/signup in navbar
  TUTOR_REGISTRATION: false,   // Toggle to show "Join as Tutor" page
  STUDENT_ENROLLMENT: false,   // Toggle to show enrollment features
  RESOURCE_LOCKING: false,     // Toggle to enforce is_locked on resources
  BLOG_ENABLED: true,          // Blog is public from day 1
  MULTI_SUBJECT: false,        // When other subjects are added
  NOTIFY_ME_ENABLED: true,     // Silent lead gen email capture (ON from day 1)
  VIDEO_SOLUTIONS: true,       // Paper-to-video mapping sidebar (ON from day 1)
};
```

When you're ready to activate a feature, change `false` to `true` — no code rewrite needed.

---

## 8. Key UI/UX Features

### Home Page
- Hero section: "Free O-Level & A-Level Mathematics Resources"
- Quick navigation cards: Pre O-Level | O-Level | A-Level
- Latest uploads section
- Featured video lectures
- Search bar (search across all resources by year, topic, paper)
- "Notify Me" email box in footer: "Get notified when new resources drop"

### Resource Pages
- Clean grid/list view of resources
- Filter by: Year, Session, Content Type (Video/PDF/Worksheet), Topic
- Sort by: Newest, Year, Most Popular
- Each resource card shows: Title, Type icon, Year/Session, View/Print/Download buttons
- Cambridge subject code badge (e.g., "4024" or "9709")

### Past Paper Viewer Page (The Flagship Experience)
```
+------------------------------------------+------------------+
|                                          |  VIDEO SOLUTIONS |
|       CUSTOM PDF VIEWER                  |                  |
|       (@react-pdf-viewer/core)           |  Q1  (0:00)  ▶  |
|                                          |  Q2  (3:45)  ▶  |
|   [Branded toolbar]                      |  Q3  (8:12)  ▶  |
|   Print | Download | New Tab | Zoom      |  Q4  (12:30) ▶  |
|                                          |  Q5  (18:45) ▶  |
|   The PDF renders HERE, not in           |  Q6  (24:00) ▶  |
|   Google Drive UI. Student stays         |                  |
|   on examstitch.com.                     |  [YouTube embed] |
|                                          |  (plays selected |
|                                          |   question)      |
+------------------------------------------+------------------+
```
- On mobile: PDF viewer on top, Video Solutions collapsed below with accordion
- The PDF viewer is branded with ExamStitch colors (navy toolbar)

### Video Lecture Page
- Embedded YouTube player (16:9 responsive)
- Video title, description, related resources
- Playlist navigation (if grouped)
- "Related Past Paper" link below the video

### Design Theme
- Primary: Deep Navy (#1a365d)
- Accent: Gold (#d69e2e)
- Clean, academic, professional feel
- Fully responsive (mobile-first)
- Fast loading (Next.js static generation where possible)

---

## 9. Phase-by-Phase Implementation Plan

### Phase 1: Foundation & Public Launch (Current)
**Duration: 2-3 weeks**

1. Set up Next.js project with TypeScript + Tailwind CSS + shadcn/ui
2. Set up Supabase project and create database schema (ALL tables including auth, subscribers, solutions)
3. Build layout components (Navbar, Footer, Sidebar)
4. Build Home page with navigation cards and "Notify Me" email box
5. Build O-Level section with SEO-optimized URLs: `/olevel/mathematics-4024/grade-10/`
6. Build A-Level section with SEO-optimized URLs: `/alevel/mathematics-9709/as-level/paper-1-pure-mathematics/`
7. Build custom PDF Viewer with `@react-pdf-viewer/core` (branded toolbar: Print, Download, New Tab, Zoom)
8. Build YouTube VideoPlayer component with timestamp support
9. Build PaperViewerLayout (side-by-side PDF + Video Solutions sidebar)
10. Build VideoSolutionsSidebar (Q1, Q2, Q3... links with timestamps)
11. Build NotifyMeBox component for silent lead generation
12. Integrate Google Drive API for PDF fetching
13. Build auth pages (login/signup) but HIDE from navigation
14. Build admin dashboard (protected by admin role) with SolutionMapper tool
15. Set up feature flags system
16. Create Python watermarking script for original content
17. Deploy to Vercel, connect examstitch.com domain
18. Add Google Analytics
19. Add sitemap.xml + structured data (JSON-LD for educational content)

**Deliverables:** A fully functional public website where students can browse O-Level and A-Level Maths resources, view PDFs in a custom branded viewer, watch videos with question-level timestamps, print papers, and subscribe for notifications.

### Phase 2: Tutor Marketplace (Future)
**Duration: 2-3 weeks**

1. Activate auth features (toggle feature flag)
2. Build "Join as Tutor" page with application form
3. Build admin tutor approval workflow
4. Build public tutor profile pages
5. Add tutor-uploaded resources to their profiles
6. Connect Google Forms for additional data collection
7. Email subscriber list about new tutor feature launch

### Phase 3: Student Enrollment & Multi-Subject (Future)
**Duration: 3-4 weeks**

1. Activate student enrollment features
2. Build student dashboard (saved resources, progress)
3. Add more subjects (Physics, Chemistry, Additional Mathematics, etc.)
4. Add more teachers
5. Consider payment integration if premium content is introduced

---

## 10. Environment Variables Needed

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Drive
GOOGLE_DRIVE_API_KEY=your_api_key
GOOGLE_DRIVE_FOLDER_ID=your_root_folder_id

# Resend (Email)
RESEND_API_KEY=your_resend_api_key

# Site
NEXT_PUBLIC_SITE_URL=https://examstitch.com
NEXT_PUBLIC_SITE_NAME=ExamStitch

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 11. Cost Breakdown

### Phase 1 (Public Launch)
| Service       | Cost         | Notes                              |
|---------------|--------------|------------------------------------|
| Vercel        | $0/month     | Free tier (100GB bandwidth)        |
| Supabase      | $0/month     | Free tier (500MB DB, 50K auth)     |
| Google Drive  | $0/month     | 15GB free storage                  |
| YouTube       | $0/month     | Unlimited video hosting            |
| Resend        | $0/month     | Free tier (3,000 emails/month)     |
| Domain        | ~$10/year    | examstitch.com                     |
| **Total**     | **~$1/month**| Domain cost only                   |

### Phase 2+ (Scaling)
| Service        | Cost         | Notes                              |
|----------------|--------------|------------------------------------|
| Vercel Pro     | $20/month    | When traffic exceeds free tier     |
| Supabase Pro   | $25/month    | When DB/auth exceeds free tier     |
| Google Workspace| $6/month    | If more Drive storage needed       |
| Resend Growth  | $20/month    | If email volume exceeds 3K/month   |
| **Total**      | **~$71/month**| For thousands of active users     |

---

## 12. SEO Strategy

### URL Strategy (Cambridge Subject Codes in URLs)
Students search Google for very specific terms. Our URL structure matches:

| Student Searches For                           | Our URL                                                          |
|------------------------------------------------|------------------------------------------------------------------|
| "O Level Maths 4024 past papers"               | `/olevel/mathematics-4024/grade-11/past-papers`                  |
| "A Level Pure Maths 9709 Paper 1 topical"      | `/alevel/mathematics-9709/as-level/paper-1-pure-mathematics/topical` |
| "IGCSE trigonometry worksheet"                  | `/olevel/mathematics-4024/grade-10/topical/trigonometry`         |
| "9709 May June 2024 Paper 3 solutions"         | `/alevel/mathematics-9709/a2-level/paper-3/past-papers/may-june-2024-p3-v1` |

### Technical SEO
- Every resource page has proper meta tags (title, description, keywords)
- Structured data (JSON-LD) for educational content (Course, LearningResource schemas)
- Sitemap.xml auto-generated by Next.js
- Fast page loads (Core Web Vitals) from Vercel edge network
- Blog posts target long-tail keywords: "How to solve A-Level Pure Maths Paper 1"
- Open Graph images for social sharing

---

## 13. Watermarking Workflow

For original content only (NOT official Cambridge papers):

```
Step 1: Zain creates a topical worksheet or notes PDF
Step 2: Run watermark script:
        python scripts/watermark.py input.pdf output.pdf
Step 3: Upload watermarked PDF to Google Drive
Step 4: Add resource entry to database via admin dashboard
```

The watermark script adds:
- "ExamStitch.com" text diagonally across each page (semi-transparent)
- "Created by Zain" in the footer
- Page URL in small text at the bottom

---

## 14. Summary

ExamStitch.com will be built with **Next.js 14 + TypeScript + Tailwind CSS** on the frontend, **Supabase (PostgreSQL)** for database and authentication, **Google Drive** for PDF storage, **YouTube** for video hosting, and **Resend** for email notifications. Deployed on **Vercel** for free.

**5 Strategic Advantages Built Into This Blueprint:**

1. **Custom PDF Viewer** (`@react-pdf-viewer/core`) — Students never leave ExamStitch. Branded toolbar with Print/Download/Zoom. No Google Drive UI confusion.

2. **Paper-to-Video Direct Mapping** — The killer feature. Students click "Q5 Solution" next to a past paper and jump directly to that timestamp in the video. No other O/A-Level site does this well.

3. **SEO-Optimized URLs with Subject Codes** — `/olevel/mathematics-4024/topical/trigonometry` matches exactly what students type into Google. This drives organic traffic.

4. **Silent Lead Generation** — "Notify Me" email capture builds a marketing list for Phase 2 launch without requiring any signup. Powered by Resend (free).

5. **PDF Watermarking** — Original content is branded before upload. Even if scraped and reposted, ExamStitch.com branding travels with the file.

The authentication and role-based access system is built from day one but hidden from the UI. A single feature flag system controls what's visible.

**Total launch cost: ~$10/year (domain only).**

---

*This blueprint is the single source of truth for the ExamStitch.com project. All implementation decisions should reference this document.*
