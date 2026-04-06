# How to Add Resources — ExamStitch Admin Guide

> **Audience**: Teaching team (Sir Umar, Sir Najaf, subject admins)
> **Last updated**: April 2026

---

## Quick Start

1. Log in at **`/admin/login`** with your admin email & password.
2. You will be auto-redirected to your assigned subject portal (e.g. CS Admin, Math Admin).
3. Click **"Add Resource"** to open the upload form.
4. Fill in the **HierarchyPicker** fields, paste the URL, and submit.

---

## Understanding the HierarchyPicker

Every resource you upload must be routed to the correct location. The **HierarchyPicker** is the cascading dropdown that guides you through this:

```
Subject > Level (O-Level / A-Level) > Grade or Paper > Module Type > Category
```

### Step-by-Step Flow

#### Step 1 — Level

| Level   | Code Example         | What it means                     |
|---------|----------------------|-----------------------------------|
| O-Level | Mathematics (4024)   | Cambridge IGCSE / O-Level         |
| A-Level | Mathematics (9709)   | Cambridge International AS & A    |

If the subject only has O-Level (e.g. English 1123, Urdu 3247), this is auto-selected.

#### Step 2 — Grade or Paper

**If you selected O-Level:**

| Grade    | Description           |
|----------|-----------------------|
| Grade 9  | First year of O-Level |
| Grade 10 | Second year           |
| Grade 11 | Final exam year       |

**If you selected A-Level:**

First pick the **Section**:
- **AS Level** — Year 12 papers
- **A2 Level** — Year 13 papers

Then pick the **Paper** (varies by subject):

| Subject          | AS Papers                                   | A2 Papers                                        |
|------------------|---------------------------------------------|--------------------------------------------------|
| Mathematics      | Paper 1 (Pure Mathematics)                  | Paper 3 (Pure), Paper 4 (Mechanics), Paper 5 (Stats) |
| Computer Science | Paper 1 (Theory), Paper 2 (Programming)     | Paper 3 (Advanced Theory), Paper 4 (Practical)   |
| Physics          | Paper 1 (MCQ), Paper 2 (Structured)         | Paper 3 (Practical), Paper 4 (Structured), Paper 5 (Planning) |
| Chemistry        | Paper 1 (MCQ), Paper 2 (Structured)         | Paper 3 (Practical), Paper 4 (Structured), Paper 5 (Planning) |
| Biology          | Paper 1 (MCQ), Paper 2 (Structured)         | Paper 3 (Practical), Paper 4 (Structured), Paper 5 (Planning) |

#### Step 3 — Module Type

Every resource **must** be one of two types:

| Module Type         | Use When                                          | Icon    |
|---------------------|---------------------------------------------------|---------|
| **Video Lecture**    | Topical video explanations, tutorials, walkthroughs | Video   |
| **Solved Past Paper**| Worked solutions to past exam papers               | FileText|

> **Rule**: If it teaches a topic, it's a **Video Lecture**.
> If it solves an exam question, it's a **Solved Past Paper**.

#### Step 4 — Category

This auto-filters based on your Grade/Paper selection. Usually there is only one match (e.g. "Grade 9" or "Paper 1 — Pure Mathematics"). If you see multiple options, pick the most specific one.

---

## Filling in the Upload Form

| Field        | Required | Notes                                                    |
|--------------|----------|----------------------------------------------------------|
| **Title**    | Yes      | Clear and descriptive. E.g. "Binary Search — Part 1"     |
| **Level**    | Yes      | O-Level or A-Level (auto from HierarchyPicker)           |
| **Grade/Paper** | Yes   | Selected via HierarchyPicker                             |
| **Module Type** | Yes   | Video Lecture or Solved Past Paper                       |
| **Content Type** | Yes  | Video or PDF                                             |
| **Source URL** | Yes    | YouTube link or Google Drive link                        |
| **Topic**    | No       | Optional tag (e.g. "Algorithms", "Kinematics")           |

### Source URL Guidelines

- **YouTube**: Paste the full URL — `https://www.youtube.com/watch?v=abc123`
- **Google Drive PDF**: Use the shareable link — `https://drive.google.com/file/d/abc123/view`
- Make sure the file/video is **publicly accessible** or shared with "Anyone with the link".

---

## Your Admin Portal

Each admin sees only their assigned subjects:

| Role                | What You See                        | Landing Page     |
|---------------------|-------------------------------------|------------------|
| **Super Admin**     | Everything + Super Admin Panel      | `/admin/super`   |
| **CS Admin**        | CS Resources + CS Analytics only    | `/admin/cs`      |
| **Math Admin**      | Main Dashboard (Math-focused)       | `/admin`         |
| **Physics Admin**   | Physics portal (when activated)     | `/admin/physics` |

You **cannot** access other subject portals. Attempting to do so redirects to a "Forbidden" page.

### Switching Panels

If you manage multiple subjects, use the **"Switch Panel"** button in the top-right header bar to navigate between your assigned portals.

---

## Themes

ExamStitch supports 4 visual themes. Change yours via the palette button in the sidebar:

| Theme      | Style                    |
|------------|--------------------------|
| Navy       | Dark blue (default)      |
| Midnight   | Pure dark mode           |
| Beach      | Warm sandy tones         |
| Forest     | Green nature-inspired    |

Your theme choice persists across sessions via `localStorage`.

---

## Common Issues

| Problem                           | Solution                                                  |
|-----------------------------------|-----------------------------------------------------------|
| "No categories found"             | Ask Super Admin to run the category seed migration         |
| Video not playing                 | Ensure the YouTube video isn't private/restricted           |
| PDF not loading                   | Check that Google Drive sharing is set to "Anyone with link"|
| Can't see "Add Resource" button   | You may not have admin access for this subject             |
| Wrong grade/paper showing         | Refresh the page — categories load from the database       |

---

## Need Help?

Contact the Super Admin (Arfeen) or raise an issue in the team chat.
