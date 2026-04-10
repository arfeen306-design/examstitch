# Supabase Webhook → Cache Revalidation

## Overview

When data changes in Supabase, a database webhook calls our `/api/revalidate` endpoint to bust the Next.js `unstable_cache` for the affected tags.

## Endpoint

```
POST /api/revalidate
```

### Authentication

Either method works:

- **Query param**: `?secret=YOUR_REVALIDATION_SECRET`
- **Header**: `Authorization: Bearer YOUR_REVALIDATION_SECRET`

Set `REVALIDATION_SECRET` in your `.env.local` (already in `.env.example`).

### Request body (from Supabase webhook)

```json
{
  "type": "INSERT",
  "table": "resources",
  "record": { "..." },
  "old_record": { "..." }
}
```

### Table → Tag mapping

| Table              | Revalidated tag |
| ------------------ | --------------- |
| `resources`        | `resources`     |
| `categories`       | `categories`    |
| `blog_posts`       | `blog`          |
| `blogs`            | `blog`          |
| `subjects`         | `subjects`      |
| `subject_papers`   | `subjects`      |
| `levels`           | `levels`        |
| _(unknown/empty)_  | all tags        |

### Manual revalidation

```bash
curl "https://examstitch.com/api/revalidate?secret=YOUR_SECRET&table=resources"
```

## Setup in Supabase Dashboard

1. Go to **Database → Webhooks** in your Supabase project dashboard.
2. Click **Create a new webhook**.
3. Configure:
   - **Name**: `revalidate-cache`
   - **Table**: Select all tables you want to trigger on (resources, categories, blog_posts, subjects, subject_papers, levels)
   - **Events**: INSERT, UPDATE, DELETE
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://examstitch.com/api/revalidate?secret=YOUR_REVALIDATION_SECRET`
   - **Headers**: `Content-Type: application/json`
4. Save.

Repeat for each table, or create one webhook per table if you want granular control.

## Testing

```bash
# Revalidate everything
curl -X POST "http://localhost:3000/api/revalidate" \
  -H "Authorization: Bearer your-secret" \
  -H "Content-Type: application/json" \
  -d '{"table": "resources"}'

# Manual GET
curl "http://localhost:3000/api/revalidate?secret=your-secret&table=categories"
```
