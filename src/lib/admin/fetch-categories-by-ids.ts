import type { SupabaseClient } from '@supabase/supabase-js';

/** Rows needed for resource insert validation + syllabus guard. */
export type CategoryRowLight = {
  id: string;
  subject_id: string | null;
  syllabus_id: string | null;
  syllabus_tier_id: string | null;
  parent_id: string | null;
};

const SELECT_FULL = 'id, subject_id, syllabus_id, syllabus_tier_id, parent_id' as const;
const SELECT_MIN = 'id, subject_id, syllabus_id, parent_id' as const;

/**
 * Load categories by id in small chunks (avoids PostgREST / proxy limits on large `.in()` lists)
 * and falls back to a minimal select if `syllabus_tier_id` is absent on older databases.
 */
export async function fetchCategoryRowsForIdsInChunks(
  supabase: SupabaseClient,
  ids: string[],
  chunkSize = 60,
): Promise<{ rows: CategoryRowLight[]; errorMessage: string | null }> {
  const unique = [...new Set(ids.filter(Boolean))];
  const out: CategoryRowLight[] = [];

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const full = await supabase.from('categories').select(SELECT_FULL).in('id', chunk);
    if (!full.error && full.data) {
      out.push(...(full.data as CategoryRowLight[]));
      continue;
    }
    const min = await supabase.from('categories').select(SELECT_MIN).in('id', chunk);
    if (min.error) {
      return {
        rows: [],
        errorMessage: min.error.message || full.error?.message || 'categories query failed',
      };
    }
    for (const r of min.data ?? []) {
      const row = r as Omit<CategoryRowLight, 'syllabus_tier_id'>;
      out.push({ ...row, syllabus_tier_id: null });
    }
  }

  return { rows: out, errorMessage: null };
}
