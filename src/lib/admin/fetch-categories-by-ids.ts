import type { SupabaseClient } from '@supabase/supabase-js';

/** Rows needed for resource insert validation + syllabus guard. */
export type CategoryRowLight = {
  id: string;
  subject_id: string | null;
  syllabus_id: string | null;
  syllabus_tier_id: string | null;
  parent_id: string | null;
};

function normalizeStarRow(raw: Record<string, unknown>): CategoryRowLight {
  return {
    id: String(raw.id),
    subject_id: (raw.subject_id as string | null) ?? null,
    syllabus_id: (raw.syllabus_id as string | null) ?? null,
    syllabus_tier_id: (raw.syllabus_tier_id as string | null) ?? null,
    parent_id: (raw.parent_id as string | null) ?? null,
  };
}

/**
 * Load categories by id. Prefer `select('*')` so optional columns never break the query on older DBs.
 * For small id sets, uses parallel `.eq('id', …).maybeSingle()` to avoid PostgREST `.in()` failures seen in production.
 */
export async function fetchCategoryRowsForIdsInChunks(
  supabase: SupabaseClient,
  ids: string[],
  chunkSize = 40,
): Promise<{ rows: CategoryRowLight[]; errorMessage: string | null }> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return { rows: [], errorMessage: null };

  const STAR = '*';

  // Fast path: moderate id count — single-row fetches (no `.in()` list), small parallel batches.
  if (unique.length <= 64) {
    const out: CategoryRowLight[] = [];
    const parallel = 8;
    for (let i = 0; i < unique.length; i += parallel) {
      const slice = unique.slice(i, i + parallel);
      const settled = await Promise.all(
        slice.map((id) => supabase.from('categories').select(STAR).eq('id', id).maybeSingle()),
      );
      for (let j = 0; j < settled.length; j++) {
        const { data, error } = settled[j];
        const id = slice[j];
        if (error) {
          return { rows: [], errorMessage: `${error.message} (category ${id})` };
        }
        if (!data) {
          return { rows: [], errorMessage: `Category not found in database: ${id}` };
        }
        out.push(normalizeStarRow(data as Record<string, unknown>));
      }
    }
    return { rows: out, errorMessage: null };
  }

  // Many ids: chunked `.in()` with `*`, then per-id fallback for any chunk that errors.
  const out: CategoryRowLight[] = [];
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const batch = await supabase.from('categories').select(STAR).in('id', chunk);
    if (!batch.error && batch.data && batch.data.length > 0) {
      for (const row of batch.data) {
        out.push(normalizeStarRow(row as Record<string, unknown>));
      }
      continue;
    }
    for (const id of chunk) {
      const one = await supabase.from('categories').select(STAR).eq('id', id).maybeSingle();
      if (one.error) {
        return { rows: [], errorMessage: one.error.message || batch.error?.message || 'categories query failed' };
      }
      if (!one.data) {
        return { rows: [], errorMessage: `Category not found: ${id}` };
      }
      out.push(normalizeStarRow(one.data as Record<string, unknown>));
    }
  }

  return { rows: out, errorMessage: null };
}
