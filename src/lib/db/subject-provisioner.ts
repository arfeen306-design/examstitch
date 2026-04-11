import type { SupabaseClient } from '@supabase/supabase-js';
import { ADMIN_PORTALS, getPortalDbSubjectSlug, type AdminPortal } from '@/config/admin-portals';
import { aLevelPapersBySubject, oLevelToALevelSlug } from '@/config/navigation';

/** Service-role client; avoid `SupabaseClient<Database>` here — hand-written Database omits supabase-js v2 schema keys, which collapses Insert/Row to `never`. */
type AdminClient = SupabaseClient;

/** Ensure syllabi rows exist for a subject (idempotent). */
export async function ensureSyllabiForSubject(
  supabase: AdminClient,
  subjectId: string,
  options?: { includeALevel?: boolean },
): Promise<void> {
  const includeALevel = options?.includeALevel !== false;
  const rows = includeALevel
    ? [
        { subject_id: subjectId, tier: 'olevel' as const, name: 'O-Level', sort_order: 1 },
        { subject_id: subjectId, tier: 'alevel' as const, name: 'A-Level', sort_order: 2 },
      ]
    : [{ subject_id: subjectId, tier: 'olevel' as const, name: 'O-Level', sort_order: 1 }];
  const { error } = await supabase.from('syllabi').upsert(rows, {
    onConflict: 'subject_id,tier',
    ignoreDuplicates: false,
  });
  if (error) throw new Error(`syllabi upsert: ${error.message}`);
}

async function resolveTierIds(supabase: AdminClient, subjectId: string, includeALevel: boolean) {
  const { data: tiers, error } = await supabase
    .from('syllabi')
    .select('id, tier')
    .eq('subject_id', subjectId);
  if (error) throw new Error(error.message);
  const o = tiers?.find(t => t.tier === 'olevel')?.id;
  const a = includeALevel ? tiers?.find(t => t.tier === 'alevel')?.id : null;
  if (!o) throw new Error('O-Level syllabi tier not found.');
  if (includeALevel && !a) throw new Error('A-Level syllabi tier not found.');
  return { olevelId: o, alevelId: a };
}

async function resolvePaperIds(supabase: AdminClient, subjectId: string, portal: AdminPortal) {
  const { data: papers, error: pErr } = await supabase
    .from('subject_papers')
    .select('id, slug, level_id')
    .eq('parent_subject_id', subjectId);
  if (pErr) throw new Error(pErr.message);
  const { data: levels } = await supabase.from('levels').select('id, slug');
  const levelSlug = new Map((levels ?? []).map(l => [l.id, l.slug]));
  const oPaper = papers?.find(p => p.slug === portal.taxonomyOLevelPaperSlug);
  const aPaper = papers?.find(p => levelSlug.get(p.level_id ?? '') === 'alevel');
  return { oPaperId: oPaper?.id ?? null, aPaperId: aPaper?.id ?? null };
}

/** Seed CS folder tree (matches migration 016) with relational syllabi. */
async function provisionComputerScience(
  supabase: AdminClient,
  subjectId: string,
  olevelId: string,
  alevelId: string | null,
  oPaperId: string | null,
  aPaperId: string | null,
): Promise<number> {
  let n = 0;
  const ins = async (row: {
    subject_id: string;
    name: string;
    slug: string;
    sort_order: number;
    syllabus_tier_id: string;
    syllabus_id: string | null;
    parent_id: string | null;
  }) => {
    const { error } = await supabase.from('categories').insert(row);
    if (!error) n += 1;
  };

  await ins({
    subject_id: subjectId,
    name: 'O Level',
    slug: 'cs-olevel',
    sort_order: 1,
    syllabus_tier_id: olevelId,
    syllabus_id: oPaperId,
    parent_id: null,
  });

  const { data: oParent } = await supabase
    .from('categories')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('slug', 'cs-olevel')
    .maybeSingle();

  if (oParent?.id) {
    await ins({
      subject_id: subjectId,
      name: 'Paper 1 — Theory',
      slug: 'cs-paper-1-theory',
      parent_id: oParent.id,
      sort_order: 1,
      syllabus_tier_id: olevelId,
      syllabus_id: oPaperId,
    });
    await ins({
      subject_id: subjectId,
      name: 'Paper 2 — Problem Solving & Programming',
      slug: 'cs-paper-2-problem-solving',
      parent_id: oParent.id,
      sort_order: 2,
      syllabus_tier_id: olevelId,
      syllabus_id: oPaperId,
    });
  }

  if (alevelId) {
    await ins({
      subject_id: subjectId,
      name: 'A Level',
      slug: 'cs-alevel',
      sort_order: 2,
      syllabus_tier_id: alevelId,
      syllabus_id: aPaperId,
      parent_id: null,
    });
  }

  const { data: aParent } = alevelId
    ? await supabase
        .from('categories')
        .select('id')
        .eq('subject_id', subjectId)
        .eq('slug', 'cs-alevel')
        .maybeSingle()
    : { data: null };

  if (aParent?.id && alevelId) {
    const papers: [string, string, number][] = [
      ['cs-a-paper-1-theory', 'Paper 1 — Theory Fundamentals', 1],
      ['cs-a-paper-2-problem-solving', 'Paper 2 — Fundamental Problem-solving', 2],
      ['cs-a-paper-3-advanced-theory', 'Paper 3 — Advanced Theory', 3],
      ['cs-a-paper-4-practical', 'Paper 4 — Practical', 4],
    ];
    for (const [slug, name, order] of papers) {
      await ins({
        subject_id: subjectId,
        name,
        slug,
        parent_id: aParent.id,
        sort_order: order,
        syllabus_tier_id: alevelId,
        syllabus_id: aPaperId,
      });
    }
  }
  return n;
}

const OLEVEL_GRADE_SEED: [string, string, number][] = [
  ['grade-9', 'Grade 9', 1],
  ['grade-10', 'Grade 10', 2],
  ['grade-11', 'Grade 11', 3],
];

/** Idempotent: O-Level grade folders (parent subject_id). */
async function ensureOLevelGradeCategoriesIfMissing(
  supabase: AdminClient,
  subjectId: string,
  olevelId: string,
  oPaperId: string | null,
): Promise<number> {
  let n = 0;
  for (const [slug, name, order] of OLEVEL_GRADE_SEED) {
    const { data: ex } = await supabase
      .from('categories')
      .select('id')
      .eq('subject_id', subjectId)
      .eq('slug', slug)
      .maybeSingle();
    if (ex) continue;
    const { error } = await supabase.from('categories').insert({
      subject_id: subjectId,
      name,
      slug,
      sort_order: order,
      syllabus_tier_id: olevelId,
      syllabus_id: oPaperId,
      parent_id: null,
    });
    if (!error) n += 1;
  }
  return n;
}

/** Idempotent: AS Level / A2 Level root rows for A-Level syllabi. */
async function ensureAsA2RootCategoriesIfMissing(
  supabase: AdminClient,
  subjectId: string,
  alevelId: string,
  aPaperId: string | null,
): Promise<number> {
  let n = 0;
  const roots: [string, string, number][] = [
    ['as-level', 'AS Level', 4],
    ['a2-level', 'A2 Level', 5],
  ];
  for (const [slug, name, order] of roots) {
    const { data: ex } = await supabase
      .from('categories')
      .select('id')
      .eq('subject_id', subjectId)
      .eq('slug', slug)
      .maybeSingle();
    if (ex) continue;
    const { error } = await supabase.from('categories').insert({
      subject_id: subjectId,
      name,
      slug,
      sort_order: order,
      syllabus_tier_id: alevelId,
      syllabus_id: aPaperId,
      parent_id: null,
    });
    if (!error) n += 1;
  }
  return n;
}

/**
 * Idempotent: A-Level paper categories under as-level / a2-level using the same
 * slugs as `aLevelPapersBySubject` (HierarchyPicker + public nav). Skips CS (custom tree).
 */
async function ensureSciencePaperCategories(
  supabase: AdminClient,
  portal: AdminPortal,
  subjectId: string,
  alevelId: string,
  aPaperId: string | null,
): Promise<number> {
  const aLevelNavSlug = oLevelToALevelSlug[portal.taxonomyOLevelPaperSlug];
  if (!aLevelNavSlug) return 0;
  const papersCfg = aLevelPapersBySubject[aLevelNavSlug];
  if (!papersCfg) return 0;

  const { data: asParent } = await supabase
    .from('categories')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('slug', 'as-level')
    .maybeSingle();
  const { data: a2Parent } = await supabase
    .from('categories')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('slug', 'a2-level')
    .maybeSingle();
  if (!asParent?.id || !a2Parent?.id) return 0;

  let n = 0;
  for (let i = 0; i < papersCfg['as-level'].length; i++) {
    const p = papersCfg['as-level'][i];
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('subject_id', subjectId)
      .eq('slug', p.slug)
      .maybeSingle();
    if (existing) continue;
    const { error } = await supabase.from('categories').insert({
      subject_id: subjectId,
      name: p.label,
      slug: p.slug,
      parent_id: asParent.id,
      sort_order: i + 1,
      syllabus_tier_id: alevelId,
      syllabus_id: aPaperId,
    });
    if (!error) n += 1;
  }
  for (let i = 0; i < papersCfg['a2-level'].length; i++) {
    const p = papersCfg['a2-level'][i];
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('subject_id', subjectId)
      .eq('slug', p.slug)
      .maybeSingle();
    if (existing) continue;
    const { error } = await supabase.from('categories').insert({
      subject_id: subjectId,
      name: p.label,
      slug: p.slug,
      parent_id: a2Parent.id,
      sort_order: i + 1,
      syllabus_tier_id: alevelId,
      syllabus_id: aPaperId,
    });
    if (!error) n += 1;
  }
  return n;
}

/** Seed O-Level grades + AS/A2 roots when the subject has zero merged categories. */
async function provisionDefaultScienceStructure(
  supabase: AdminClient,
  subjectId: string,
  olevelId: string,
  alevelId: string | null,
  oPaperId: string | null,
  aPaperId: string | null,
): Promise<number> {
  let n = 0;
  n += await ensureOLevelGradeCategoriesIfMissing(supabase, subjectId, olevelId, oPaperId);
  if (alevelId) {
    n += await ensureAsA2RootCategoriesIfMissing(supabase, subjectId, alevelId, aPaperId);
  }
  return n;
}

/**
 * End-to-end: syllabi + default category tree for a configured admin portal.
 * Idempotent: skips category inserts if the subject already has categories.
 */
export async function provisionSubjectPortal(
  supabase: AdminClient,
  portalRouteSegment: string,
): Promise<{ success: boolean; error?: string; categoriesCreated?: number }> {
  const portal = ADMIN_PORTALS.find(p => p.routeSegment === portalRouteSegment);
  if (!portal) {
    return { success: false, error: `Unknown portal segment "${portalRouteSegment}".` };
  }

  const slug = getPortalDbSubjectSlug(portal);
  const { data: subj, error: sErr } = await supabase.from('subjects').select('id').eq('slug', slug).maybeSingle();
  if (sErr) return { success: false, error: sErr.message };
  if (!subj) {
    return { success: false, error: `Subject "${slug}" is not in the database. Create it in Subject Factory first.` };
  }

  const includeALevel = portal.hasALevelSyllabus !== false;

  try {
    await ensureSyllabiForSubject(supabase, subj.id, { includeALevel });

    const { data: existingCats, error: exErr } = await fetchMergedCategoriesForSubject(supabase, subj.id);
    if (exErr) return { success: false, error: exErr };

    const { olevelId, alevelId } = await resolveTierIds(supabase, subj.id, includeALevel);
    const { oPaperId, aPaperId } = await resolvePaperIds(supabase, subj.id, portal);

    let created = 0;
    if (existingCats.length === 0) {
      if (portal.routeSegment === 'cs') {
        created = await provisionComputerScience(supabase, subj.id, olevelId, alevelId, oPaperId, aPaperId);
      } else {
        created = await provisionDefaultScienceStructure(supabase, subj.id, olevelId, alevelId, oPaperId, aPaperId);
      }
    }

    // Idempotent backfill: grades, AS/A2 roots, and A-Level paper rows (Physics/Chem/Bio/Math; not CS).
    if (portal.routeSegment !== 'cs') {
      created += await ensureOLevelGradeCategoriesIfMissing(supabase, subj.id, olevelId, oPaperId);
      if (includeALevel && alevelId) {
        created += await ensureAsA2RootCategoriesIfMissing(supabase, subj.id, alevelId, aPaperId);
        created += await ensureSciencePaperCategories(supabase, portal, subj.id, alevelId, aPaperId);
      }
    }

    return { success: true, categoriesCreated: created };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

/** Row shape for admin category pickers (subject + syllabus-linked trees). */
export interface MergedCategoryRow {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number | null;
}

/**
 * Categories for a parent subject (deduped):
 * - `subject_id` = parent discipline row
 * - `syllabus_id` ∈ this subject's `subject_papers` ids
 * - **Legacy:** `subject_id` was a `subject_papers.id` before FK migration 016; those
 *   rows still point at paper UUIDs, so we include `subject_id` ∈ paper ids.
 */
export async function fetchMergedCategoriesForSubject(
  supabase: SupabaseClient,
  subjectId: string,
): Promise<{ data: MergedCategoryRow[]; error: string | null }> {
  const [{ data: bySubject, error: e1 }, papersRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug, parent_id, sort_order')
      .eq('subject_id', subjectId)
      .order('sort_order'),
    supabase.from('subject_papers').select('id').eq('parent_subject_id', subjectId),
  ]);

  if (e1) return { data: [], error: e1.message };
  if (papersRes.error) return { data: [], error: papersRes.error.message };

  const paperIds = (papersRes.data ?? []).map((p) => p.id).filter(Boolean);
  let bySyllabus: MergedCategoryRow[] = [];
  let byLegacyPaperSubjectId: MergedCategoryRow[] = [];
  if (paperIds.length > 0) {
    const [sylRes, legRes] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, slug, parent_id, sort_order')
        .in('syllabus_id', paperIds)
        .order('sort_order'),
      supabase
        .from('categories')
        .select('id, name, slug, parent_id, sort_order')
        .in('subject_id', paperIds)
        .order('sort_order'),
    ]);
    if (sylRes.error) return { data: [], error: sylRes.error.message };
    if (legRes.error) return { data: [], error: legRes.error.message };
    bySyllabus = (sylRes.data ?? []) as MergedCategoryRow[];
    byLegacyPaperSubjectId = (legRes.data ?? []) as MergedCategoryRow[];
  }

  const map = new Map<string, MergedCategoryRow>();
  for (const row of [...(bySubject ?? []), ...bySyllabus, ...byLegacyPaperSubjectId] as MergedCategoryRow[]) {
    map.set(row.id, row);
  }
  const merged = Array.from(map.values());
  merged.sort((a, b) => {
    const ao = a.sort_order ?? 9999;
    const bo = b.sort_order ?? 9999;
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name);
  });
  return { data: merged, error: null };
}
