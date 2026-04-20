#!/usr/bin/env npx tsx
/**
 * Database health check for resource identity drift.
 *
 * Usage:
 *   npx tsx scripts/check-db-health.ts
 *
 * Exit code:
 *   0 => healthy
 *   1 => drift detected or query failure
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = resolve(process.cwd(), '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // rely on runtime env vars
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const SUPABASE_URL_VALUE = SUPABASE_URL as string;
const SERVICE_KEY_VALUE = SERVICE_KEY as string;

async function main() {
  try {
    const supabase = createClient(SUPABASE_URL_VALUE, SERVICE_KEY_VALUE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [missingSubjectRes, missingCategoryRes, mismatchRes] = await Promise.all([
      supabase
        .from('resources')
        .select('id', { count: 'exact', head: true })
        .is('subject_id', null),
      supabase
        .from('resources')
        .select('id', { count: 'exact', head: true })
        .is('category_id', null),
      supabase
        .from('resources')
        .select('subject_id, category:categories(subject_id)')
        .limit(100000),
    ]);

    if (missingSubjectRes.error) throw new Error(missingSubjectRes.error.message);
    if (missingCategoryRes.error) throw new Error(missingCategoryRes.error.message);
    if (mismatchRes.error) throw new Error(mismatchRes.error.message);

    const mismatchRows = (mismatchRes.data ?? []) as Array<{
      subject_id: string | null;
      category?: { subject_id?: string | null } | null;
    }>;
    const mismatchCount = mismatchRows.filter(
      (r) => r.subject_id !== (r.category?.subject_id ?? null),
    ).length;

    const result = [
      { label: 'resources_missing_subject_id', count: Number(missingSubjectRes.count ?? 0) },
      { label: 'resources_missing_category_id', count: Number(missingCategoryRes.count ?? 0) },
      { label: 'resources_subject_mismatch_vs_category', count: mismatchCount },
    ];

    for (const row of result) {
      console.log(`${row.label}: ${row.count}`);
    }

    const hasIssues = result.some((r) => r.count > 0);
    if (hasIssues) {
      console.error('DB health check FAILED: invariant drift detected.');
      process.exit(1);
    }

    console.log('DB health check PASSED: all resource invariants are green.');
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

void main();
