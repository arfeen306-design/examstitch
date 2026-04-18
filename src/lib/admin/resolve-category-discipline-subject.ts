import type { SupabaseClient } from '@supabase/supabase-js';
import type { CategoryRowLight } from '@/lib/admin/fetch-categories-by-ids';

/**
 * Maps each category id → parent discipline `subjects.id`.
 *
 * Historically some rows used `categories.subject_id = subject_papers.id` (paper row).
 * Resources and RBAC always use the discipline subject id; this resolves the mismatch.
 */
export async function resolveDisciplineSubjectIdByCategoryRow(
  supabase: SupabaseClient,
  rows: CategoryRowLight[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (rows.length === 0) return out;

  const byId = new Map(rows.map((r) => [r.id, r]));
  const rawIds = new Set<string>();

  for (const r of rows) {
    let cur: CategoryRowLight | undefined = r;
    const seen = new Set<string>();
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      if (cur.subject_id) rawIds.add(cur.subject_id);
      cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
    }
  }

  const rawList = [...rawIds];
  if (rawList.length === 0) return out;

  const { data: subjHits } = await supabase.from('subjects').select('id').in('id', rawList);
  const isSubject = new Set((subjHits ?? []).map((s) => s.id));

  const maybePapers = rawList.filter((id) => !isSubject.has(id));
  const paperToParent = new Map<string, string>();
  if (maybePapers.length > 0) {
    const { data: papers } = await supabase
      .from('subject_papers')
      .select('id, parent_subject_id')
      .in('id', maybePapers);
    for (const p of papers ?? []) {
      if (p.parent_subject_id) paperToParent.set(p.id, p.parent_subject_id);
    }
  }

  function resolveRaw(raw: string | null): string | null {
    if (!raw) return null;
    if (isSubject.has(raw)) return raw;
    return paperToParent.get(raw) ?? null;
  }

  for (const r of rows) {
    let cur: CategoryRowLight | undefined = r;
    const seen = new Set<string>();
    let owner: string | null = null;
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      const resolved = resolveRaw(cur.subject_id);
      if (resolved) {
        owner = resolved;
        break;
      }
      cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
    }
    if (owner) out.set(r.id, owner);
  }

  return out;
}
