import type { SupabaseClient } from '@supabase/supabase-js';
import { ADMIN_PORTALS, getPortalDbSubjectSlug, type AdminPortal } from '@/config/admin-portals';

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

/** Default grades + optional AS/A2 shells for science-style portals (empty subjects only). */
async function provisionDefaultScienceStructure(
  supabase: AdminClient,
  subjectId: string,
  olevelId: string,
  alevelId: string | null,
  oPaperId: string | null,
  aPaperId: string | null,
): Promise<number> {
  let n = 0;
  const grades: [string, string, number][] = [
    ['grade-9', 'Grade 9', 1],
    ['grade-10', 'Grade 10', 2],
    ['grade-11', 'Grade 11', 3],
  ];
  for (const [slug, name, order] of grades) {
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

  if (alevelId) {
    const { error: e1 } = await supabase.from('categories').insert({
      subject_id: subjectId,
      name: 'AS Level',
      slug: 'as-level',
      sort_order: 4,
      syllabus_tier_id: alevelId,
      syllabus_id: aPaperId,
      parent_id: null,
    });
    if (!e1) n += 1;

    const { error: e2 } = await supabase.from('categories').insert({
      subject_id: subjectId,
      name: 'A2 Level',
      slug: 'a2-level',
      sort_order: 5,
      syllabus_tier_id: alevelId,
      syllabus_id: aPaperId,
      parent_id: null,
    });
    if (!e2) n += 1;
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
  await ensureSyllabiForSubject(supabase, subj.id, { includeALevel });

  const { data: papersForCount } = await supabase
    .from('subject_papers')
    .select('id')
    .eq('parent_subject_id', subj.id);
  const paperIdsForCount = (papersForCount ?? []).map((p) => p.id);

  const { count: countBySubject, error: cErr } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('subject_id', subj.id);
  if (cErr) return { success: false, error: cErr.message };

  let countBySyllabus = 0;
  if (paperIdsForCount.length > 0) {
    const { count: cSyl, error: csErr } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .in('syllabus_id', paperIdsForCount);
    if (csErr) return { success: false, error: csErr.message };
    countBySyllabus = cSyl ?? 0;
  }

  if ((countBySubject ?? 0) > 0 || countBySyllabus > 0) {
    return { success: true, categoriesCreated: 0 };
  }

  const { olevelId, alevelId } = await resolveTierIds(supabase, subj.id, includeALevel);
  const { oPaperId, aPaperId } = await resolvePaperIds(supabase, subj.id, portal);

  let created = 0;
  if (portal.routeSegment === 'cs') {
    created = await provisionComputerScience(supabase, subj.id, olevelId, alevelId, oPaperId, aPaperId);
  } else {
    created = await provisionDefaultScienceStructure(supabase, subj.id, olevelId, alevelId, oPaperId, aPaperId);
  }

  return { success: true, categoriesCreated: created };
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
 * Categories for a parent subject: `subject_id` match OR `syllabus_id` on any
 * `subject_papers` row for that parent (deduped). Use in subject admin UIs so
 * modules appear when taxonomy was seeded against paper rows only.
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
  if (paperIds.length > 0) {
    const { data: sylCats, error: e2 } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, sort_order')
      .in('syllabus_id', paperIds)
      .order('sort_order');
    if (e2) return { data: [], error: e2.message };
    bySyllabus = (sylCats ?? []) as MergedCategoryRow[];
  }

  const map = new Map<string, MergedCategoryRow>();
  for (const row of [...(bySubject ?? []), ...bySyllabus] as MergedCategoryRow[]) {
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
