#!/usr/bin/env npx tsx
/**
 * Category Slug Diagnostic — checks every category in Supabase
 * against the frontend routing conventions.
 *
 * Usage:
 *   npm run check-slugs
 *   npx tsx scripts/check-category-slugs.ts
 *
 * Exit codes:
 *   0  All slugs valid
 *   1  At least one invalid slug found
 *
 * See docs/CATEGORY_SLUG_CONVENTION.md for the slug specification.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually (no dotenv dependency)
const envPath = resolve(process.cwd(), '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env.local not found — rely on existing environment variables
}

// ── Slug validation (inlined to keep the script self-contained) ────────────

const OLEVEL_SLUG_RE = /^grade-(9|10|11)$/;
const ALEVEL_PAPER_SLUG_RE = /^paper-\d+-[a-z0-9]+(-[a-z0-9]+)*$/;
const ALEVEL_SECTION_SLUG_RE = /^(as-level|a2-level)$/;

const SUBJECT_PREFIXES = [
  'cs-', 'maths-', 'math-', 'physics-', 'phys-', 'chemistry-', 'chem-',
  'biology-', 'bio-', 'english-', 'urdu-', 'pakistan-',
];

function hasSubjectPrefix(slug: string): string | null {
  return SUBJECT_PREFIXES.find(p => slug.startsWith(p)) ?? null;
}

// ── Types ──────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
  subject_id: string;
  parent_id: string | null;
}

interface Subject {
  id: string;
  name: string;
  slug: string;
}

interface SubjectPaper {
  slug: string;
  parent_subject_id: string;
}

interface CheckResult {
  category: Category;
  subjectName: string;
  level: 'olevel' | 'alevel' | 'unknown';
  valid: boolean;
  error?: string;
}

// ── Supabase REST helpers ──────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  console.error('Make sure .env.local is present and contains both variables.');
  process.exit(1);
}

async function query<T>(table: string, select: string): Promise<T[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase query failed: ${table} → ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T[]>;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  // Fetch data
  const [categories, subjects, papers] = await Promise.all([
    query<Category>('categories', 'id,name,slug,subject_id,parent_id'),
    query<Subject>('subjects', 'id,name,slug'),
    query<SubjectPaper>('subject_papers', 'slug,parent_subject_id'),
  ]);

  // Build lookup: subject_id → subject name
  const subjectNameById = new Map(subjects.map(s => [s.id, s.name]));

  // Build lookup: parent_subject_id → set of subject_paper slugs
  // This tells us which levels a subject supports
  const paperSlugsBySubjectId = new Map<string, Set<string>>();
  for (const p of papers) {
    if (!paperSlugsBySubjectId.has(p.parent_subject_id)) {
      paperSlugsBySubjectId.set(p.parent_subject_id, new Set());
    }
    paperSlugsBySubjectId.get(p.parent_subject_id)!.add(p.slug);
  }

  // Build lookup: category id → category (for parent lookups)
  const categoryById = new Map(categories.map(c => [c.id, c]));

  // Determine if a category is O-Level grade, A-Level section, or A-Level paper
  function classifyAndValidate(cat: Category): CheckResult {
    const subjectName = subjectNameById.get(cat.subject_id) ?? 'Unknown';

    // Check for subject prefix first
    const prefix = hasSubjectPrefix(cat.slug);
    if (prefix) {
      return {
        category: cat,
        subjectName,
        level: 'unknown',
        valid: false,
        error: `Has subject prefix "${prefix}". Remove the prefix.`,
      };
    }

    // Top-level category (parent_id = null)
    if (cat.parent_id === null) {
      // Is it a grade? → O-Level
      if (OLEVEL_SLUG_RE.test(cat.slug)) {
        return { category: cat, subjectName, level: 'olevel', valid: true };
      }
      // Is it an A-Level section?
      if (ALEVEL_SECTION_SLUG_RE.test(cat.slug)) {
        return { category: cat, subjectName, level: 'alevel', valid: true };
      }
      // Unknown top-level slug
      return {
        category: cat,
        subjectName,
        level: 'unknown',
        valid: false,
        error: `Top-level slug "${cat.slug}" is not a valid grade (grade-9/10/11) or section (as-level/a2-level).`,
      };
    }

    // Child category (has parent_id) → should be an A-Level paper
    const parent = categoryById.get(cat.parent_id);
    if (parent && ALEVEL_SECTION_SLUG_RE.test(parent.slug)) {
      // Parent is an A-Level section → this must be a paper
      if (ALEVEL_PAPER_SLUG_RE.test(cat.slug)) {
        return { category: cat, subjectName, level: 'alevel', valid: true };
      }
      return {
        category: cat,
        subjectName,
        level: 'alevel',
        valid: false,
        error: `Paper slug "${cat.slug}" doesn't match pattern paper-N-name (e.g. paper-1-theory-fundamentals).`,
      };
    }

    // Child of a non-standard parent — check if it at least has valid paper format
    if (ALEVEL_PAPER_SLUG_RE.test(cat.slug)) {
      return { category: cat, subjectName, level: 'alevel', valid: true };
    }

    return {
      category: cat,
      subjectName,
      level: 'unknown',
      valid: false,
      error: `Slug "${cat.slug}" doesn't match any expected format (grade-N, as-level/a2-level, or paper-N-name).`,
    };
  }

  // Run checks
  const results = categories.map(classifyAndValidate);
  const valid = results.filter(r => r.valid);
  const invalid = results.filter(r => !r.valid);

  // Group by subject for display
  function groupBySubject(items: CheckResult[]): Map<string, CheckResult[]> {
    const map = new Map<string, CheckResult[]>();
    for (const r of items) {
      const key = r.subjectName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }

  // ── Print report ───────────────────────────────────────────────────────

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Category Slug Diagnostic Report');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  // Valid slugs
  const validGrouped = groupBySubject(valid);
  if (valid.length > 0) {
    console.log('  \x1b[32m✅ VALID SLUGS\x1b[0m (these will work on the public site):');
    console.log('');
    for (const [subject, items] of validGrouped) {
      const byLevel = {
        olevel: items.filter(r => r.level === 'olevel').map(r => r.category.slug),
        alevel: items.filter(r => r.level === 'alevel').map(r => r.category.slug),
      };
      if (byLevel.olevel.length > 0) {
        console.log(`     ${subject} O-Level: ${byLevel.olevel.join(', ')}`);
      }
      if (byLevel.alevel.length > 0) {
        console.log(`     ${subject} A-Level: ${byLevel.alevel.join(', ')}`);
      }
    }
  }

  // Invalid slugs
  if (invalid.length > 0) {
    console.log('');
    console.log('  \x1b[31m❌ INVALID SLUGS\x1b[0m (these will cause "Category not found"):');
    console.log('');
    const invalidGrouped = groupBySubject(invalid);
    for (const [subject, items] of invalidGrouped) {
      for (const r of items) {
        console.log(`     ${subject}: "${r.category.slug}" (${r.category.name})`);
        console.log(`       → ${r.error}`);
      }
    }
  }

  // Summary
  console.log('');
  console.log('───────────────────────────────────────────────────────');
  console.log(`  Total: ${results.length} categories | ${valid.length} valid | ${invalid.length} invalid`);
  console.log('───────────────────────────────────────────────────────');
  console.log('');

  if (invalid.length > 0) {
    console.log('  Fix invalid slugs using the convention in docs/CATEGORY_SLUG_CONVENTION.md');
    console.log('');
    process.exit(1);
  } else {
    console.log('  All category slugs match the frontend routing conventions.');
    console.log('');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
