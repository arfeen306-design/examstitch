/**
 * Server-side guards: resources must carry a resolved subject_papers.id as syllabus_id
 * that matches the chosen category's Cambridge tier (O-Level vs A-Level).
 *
 * Schema note: public.topics.syllabus_id already references subject_papers (migration 20260411).
 * Resources use the same lineage via resources.syllabus_id + categories.syllabus_tier_id → syllabi.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchCategoryRowsForIdsInChunks } from '@/lib/admin/fetch-categories-by-ids';
import { resolveDisciplineSubjectIdByCategoryRow } from '@/lib/admin/resolve-category-discipline-subject';

type AdminSupabase = SupabaseClient;

export type CategoryGuardRow = {
  id: string;
  /** Discipline subject or legacy `subject_papers.id` — use resolved discipline for comparisons. */
  subject_id: string | null;
  syllabus_id: string | null;
  syllabus_tier_id: string | null;
  parent_id: string | null;
};

type PaperRow = {
  id: string;
  slug: string;
  parent_subject_id: string | null;
  level_id: string | null;
};

function levelSlugToTier(slug: string | null | undefined): 'olevel' | 'alevel' {
  if (!slug) return 'olevel';
  if (slug === 'alevel') return 'alevel';
  return 'olevel';
}

/** Walk parents until a category row exposes syllabus_id (Cambridge paper). */
export function resolveInheritedCategorySyllabusId(
  leafId: string,
  byId: Map<string, CategoryGuardRow>,
): string | null {
  const seen = new Set<string>();
  let cur: string | undefined = leafId;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const row = byId.get(cur);
    if (!row) return null;
    if (row.syllabus_id) return row.syllabus_id;
    cur = row.parent_id ?? undefined;
  }
  return null;
}

export async function loadCategoryClosure(supabase: AdminSupabase, seedIds: string[]): Promise<Map<string, CategoryGuardRow>> {
  const byId = new Map<string, CategoryGuardRow>();
  let pending = [...new Set(seedIds.filter(Boolean))];
  let guard = 0;
  while (pending.length > 0 && guard < 25) {
    guard += 1;
    const { rows, errorMessage } = await fetchCategoryRowsForIdsInChunks(supabase, pending);
    if (errorMessage) throw new Error(errorMessage);
    const nextParents: string[] = [];
    for (const row of rows) {
      if (byId.has(row.id)) continue;
      byId.set(row.id, row as CategoryGuardRow);
      if (row.parent_id && !byId.has(row.parent_id)) nextParents.push(row.parent_id);
    }
    pending = nextParents;
  }
  return byId;
}

export type BatchRowForGuard = {
  category_id?: string;
  syllabus_id?: string;
  subject_id?: string;
  parent_resource_id?: string;
  _rowIndex: number;
};

export async function assertResourceSyllabusBatch(
  supabase: AdminSupabase,
  rows: BatchRowForGuard[],
): Promise<{ ok: true; resolvedSyllabusIds: Map<number, string> } | { ok: false; error: string }> {
  const resolvedSyllabusIds = new Map<number, string>();

  const catIds = [...new Set(rows.map(r => r.category_id).filter(Boolean) as string[])];
  if (catIds.length === 0) {
    return { ok: false, error: 'Each resource must include a category_id (hierarchy leaf).' };
  }

  let byId: Map<string, CategoryGuardRow>;
  try {
    byId = await loadCategoryClosure(supabase, catIds);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to load categories.' };
  }

  for (const id of catIds) {
    if (!byId.has(id)) {
      return { ok: false, error: `Unknown category_id "${id}".` };
    }
  }

  const disciplineByCatId = await resolveDisciplineSubjectIdByCategoryRow(
    supabase,
    [...byId.values()].map((c) => ({
      id: c.id,
      subject_id: c.subject_id,
      syllabus_id: c.syllabus_id,
      syllabus_tier_id: c.syllabus_tier_id,
      parent_id: c.parent_id,
    })),
  );

  const paperIds = new Set<string>();
  for (const row of rows) {
    if (!row.category_id) {
      return { ok: false, error: `Row ${row._rowIndex + 1}: category_id is required.` };
    }
    const cat = byId.get(row.category_id)!;
    const inherited = resolveInheritedCategorySyllabusId(row.category_id, byId);

    let finalPaperId: string | null = null;
    if (cat.syllabus_id) {
      finalPaperId = cat.syllabus_id;
      if (row.syllabus_id && row.syllabus_id !== cat.syllabus_id) {
        return {
          ok: false,
          error: `Row ${row._rowIndex + 1}: syllabus_id must match the category's linked paper (cannot assign a different Cambridge paper to this topic).`,
        };
      }
    } else {
      finalPaperId = row.syllabus_id ?? inherited ?? null;
    }

    if (!finalPaperId) {
      return {
        ok: false,
        error: `Row ${row._rowIndex + 1}: could not resolve syllabus_id (subject paper). Link the category (or a parent) to a Cambridge paper, or provision the portal.`,
      };
    }
    paperIds.add(finalPaperId);
    resolvedSyllabusIds.set(row._rowIndex, finalPaperId);

    const disciplineOwner = disciplineByCatId.get(row.category_id!) ?? null;
    if (row.subject_id) {
      if (!disciplineOwner) {
        return {
          ok: false,
          error: `Row ${row._rowIndex + 1}: could not resolve discipline subject for this category (check category.subject_id / parent chain).`,
        };
      }
      if (row.subject_id !== disciplineOwner) {
        return {
          ok: false,
          error: `Row ${row._rowIndex + 1}: subject_id does not match the category's discipline subject.`,
        };
      }
    }
  }

  const { data: papers, error: pErr } = await supabase
    .from('subject_papers')
    .select('id, slug, parent_subject_id, level_id')
    .in('id', [...paperIds]);
  if (pErr) return { ok: false, error: `Could not load subject papers: ${pErr.message}` };

  const paperRows = (papers ?? []) as PaperRow[];
  const levelIds = [...new Set(paperRows.map(p => p.level_id).filter((x): x is string => Boolean(x)))];
  const levelSlugById = new Map<string, string>();
  if (levelIds.length > 0) {
    const { data: levels, error: lErr } = await supabase.from('levels').select('id, slug').in('id', levelIds);
    if (lErr) return { ok: false, error: `Could not load levels: ${lErr.message}` };
    for (const lev of levels ?? []) levelSlugById.set(lev.id, lev.slug as string);
  }

  const paperById = new Map(paperRows.map(p => [p.id, p]));

  const tierIds = [
    ...new Set(
      [...byId.values()]
        .map(c => c.syllabus_tier_id)
        .filter((x): x is string => Boolean(x)),
    ),
  ];
  const tierById = new Map<string, 'olevel' | 'alevel'>();
  if (tierIds.length > 0) {
    const { data: tiers, error: tErr } = await supabase.from('syllabi').select('id, tier').in('id', tierIds);
    if (tErr) return { ok: false, error: `Could not load syllabi tiers: ${tErr.message}` };
    for (const t of tiers ?? []) {
      if (t.tier === 'olevel' || t.tier === 'alevel') tierById.set(t.id, t.tier);
    }
  }

  for (const row of rows) {
    const cat = byId.get(row.category_id!)!;
    const finalPaperId = resolvedSyllabusIds.get(row._rowIndex)!;
    const paper = paperById.get(finalPaperId);
    if (!paper) {
      return { ok: false, error: `Row ${row._rowIndex + 1}: invalid syllabus_id (subject paper not found).` };
    }
    const paperTier = levelSlugToTier(paper.level_id ? levelSlugById.get(paper.level_id) : undefined);
    const catDiscipline = disciplineByCatId.get(cat.id) ?? null;
    if (paper.parent_subject_id && catDiscipline && paper.parent_subject_id !== catDiscipline) {
      return {
        ok: false,
        error: `Row ${row._rowIndex + 1}: syllabus paper does not belong to this category's discipline subject.`,
      };
    }

    if (cat.syllabus_tier_id) {
      const expected = tierById.get(cat.syllabus_tier_id);
      if (!expected) {
        return { ok: false, error: `Row ${row._rowIndex + 1}: unknown syllabus_tier on category.` };
      }
      if (paperTier !== expected) {
        return {
          ok: false,
          error: `Row ${row._rowIndex + 1}: O-Level / A-Level mismatch — category tier is "${expected}" but paper "${paper.slug}" is ${paperTier === 'alevel' ? 'A-Level' : 'O-Level'}.`,
        };
      }
    }
  }

  return { ok: true, resolvedSyllabusIds };
}
