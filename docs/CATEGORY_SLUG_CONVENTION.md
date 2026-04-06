# Category Slug Convention

> **Why this matters:** If a category's `slug` column in Supabase doesn't
> match what the frontend URL routing expects, all resources in that
> category will be **invisible** on the public website. No errors — just
> empty pages. This document prevents that.

---

## Quick Reference

| Level   | Slug Format            | Examples                              |
|---------|------------------------|---------------------------------------|
| O-Level | `grade-{9\|10\|11}`   | `grade-9`, `grade-10`, `grade-11`     |
| A-Level section | `as-level` or `a2-level` | `as-level`, `a2-level`        |
| A-Level paper   | `paper-N-name`         | `paper-1-theory-fundamentals` |

---

## Rules

### 1. O-Level Categories

O-Level subjects share **three grade-based categories**. Every O-Level
subject uses the same three slugs:

```
grade-9
grade-10
grade-11
```

These slugs are used directly as the `[grade]` URL parameter:
```
/olevel/{subject-slug}/{grade}/video-lectures
/olevel/computer-science-0478/grade-11/video-lectures
```

The category must be a **top-level** category (`parent_id = null`).

### 2. A-Level Categories

A-Level subjects use **two section parents** and **paper children**.

**Section parents** (top-level, `parent_id = null`):
```
as-level
a2-level
```

**Paper categories** (children of a section parent):
```
paper-{number}-{descriptive-name}
```

Examples:
```
paper-1-theory-fundamentals
paper-2-problem-solving-programming
paper-3-advanced-theory
paper-4-practical
paper-1-pure-mathematics
paper-5-probability-statistics
```

These slugs are used directly as the `[paper]` URL parameter:
```
/alevel/{subject-slug}/as-level/{paper}/video-lectures
/alevel/computer-science-9618/as-level/paper-1-theory-fundamentals/video-lectures
```

### 3. What Is NOT Allowed

| Bad Slug                  | Why It's Wrong                          | Correct Slug                   |
|---------------------------|-----------------------------------------|--------------------------------|
| `cs-paper-1-theory`       | Subject prefix `cs-`                   | `paper-1-theory-fundamentals`  |
| `cs-olevel`               | Subject prefix + not a grade           | `grade-11`                     |
| `physics-paper-2`         | Subject prefix `physics-`              | `paper-2-as-structured-questions` |
| `Paper-1-Theory`          | Uppercase letters                      | `paper-1-theory`               |
| `paper 1 theory`          | Contains spaces                        | `paper-1-theory`               |
| `olevel`                  | Not a valid grade slug                 | `grade-9`, `grade-10`, or `grade-11` |
| `paper-1`                 | Missing descriptive name               | `paper-1-theory-fundamentals`  |

---

## Adding a New Subject — Step by Step

### Step 1: Add taxonomy entry
Edit `src/config/taxonomy.ts` and add a new entry to `SUBJECT_TAXONOMY`
with the correct paper definitions. The `value` field in each `PaperDef`
is for internal reference; the **slug** in `src/config/navigation.ts` is
what must match the database.

### Step 2: Add navigation config
Edit `src/config/navigation.ts`:
- Add a `subjectMeta` entry for O-Level and/or A-Level variants
- Add an `aLevelPapersBySubject` entry with the exact paper slugs

### Step 3: Create categories in Supabase
Create the categories with **exact** slugs matching the config:

**For an O-Level subject:**
```sql
INSERT INTO categories (name, slug, subject_id, parent_id, sort_order) VALUES
  ('Grade 9',  'grade-9',  '{subject_uuid}', NULL, 1),
  ('Grade 10', 'grade-10', '{subject_uuid}', NULL, 2),
  ('Grade 11', 'grade-11', '{subject_uuid}', NULL, 3);
```

**For an A-Level subject (example: Physics 9702):**
```sql
-- Section parents
INSERT INTO categories (name, slug, subject_id, parent_id, sort_order) VALUES
  ('AS Level', 'as-level', '{subject_uuid}', NULL, 1),
  ('A2 Level', 'a2-level', '{subject_uuid}', NULL, 2);

-- Paper children (use the EXACT slugs from navigation.ts)
INSERT INTO categories (name, slug, subject_id, parent_id, sort_order) VALUES
  ('Paper 1 — Multiple Choice', 'paper-1-multiple-choice', '{subject_uuid}', '{as_level_uuid}', 1),
  ('Paper 2 — AS Structured Questions', 'paper-2-as-structured-questions', '{subject_uuid}', '{as_level_uuid}', 2);
```

### Step 4: Verify with the diagnostic script
```bash
npm run check-slugs
```

This will check **every** category in the database and report any slug
that doesn't match the expected format. Fix any issues before deploying.

---

## Pre-Launch Checklist

Before going live with a new subject:

- [ ] Category slugs in Supabase match `src/config/navigation.ts` exactly
- [ ] O-Level categories use `grade-9`, `grade-10`, `grade-11`
- [ ] A-Level section parents use `as-level` and `a2-level`
- [ ] A-Level paper slugs match the `slug` field in `aLevelPapersBySubject`
- [ ] No subject prefixes in any slug (no `cs-`, `phys-`, etc.)
- [ ] `npm run check-slugs` exits with code 0
- [ ] Visit the public video-lectures page and confirm resources appear
- [ ] Visit the public past-papers page and confirm resources appear

---

## How the Routing Works (Technical Reference)

```
URL: /olevel/computer-science-0478/grade-11/video-lectures
                 ↓                    ↓
         [subject] param       [grade] param
                 ↓                    ↓
    resolveSubjectId()     getCategoryBySlug(subject, grade)
         ↓                           ↓
    parent_subject_id      categories WHERE subject_id = ? AND slug = ?
```

The `getCategoryBySlug` function in `src/lib/supabase/queries.ts`:
1. Resolves `subject_papers.slug` → `parent_subject_id`
2. Queries `categories` with `subject_id = parentId AND slug = categorySlug`
3. If no match → returns `null` → page shows "Category not found"

This is why the slug must be an **exact match** — there is no fuzzy
lookup or fallback.
