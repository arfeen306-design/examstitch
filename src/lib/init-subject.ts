import { createAdminClient } from '@/lib/supabase/admin';
import { MODULE_TYPES } from '@/lib/constants';

/**
 * **Single source of truth** for public subject portals: every provisioned subject
 * (Mathematics, Physics, Chemistry, CS, …) exposes exactly these two `resources.module_type` lanes.
 *
 * - Use `PORTAL_RESOURCE_STREAMS.videoLectures` for topic video + worksheet streams (routes like `…/video-lectures`).
 * - Use `PORTAL_RESOURCE_STREAMS.solvedPastPapers` for past-paper streams (routes like `…/past-papers`).
 *
 * Provisioning (`initSubjectHierarchy` below) does not duplicate these strings — imports should
 * reference this object so new subjects inherit the same dual-lane contract automatically.
 */
export const PORTAL_RESOURCE_STREAMS = {
  videoLectures: MODULE_TYPES.VIDEO_TOPICAL,
  solvedPastPapers: MODULE_TYPES.SOLVED_PAST_PAPER,
} as const;

export type PortalResourceStreamKey = keyof typeof PORTAL_RESOURCE_STREAMS;

/** Union of the two DB `module_type` values used on public STEM portals */
export type PortalResourceStreamModuleType =
  (typeof PORTAL_RESOURCE_STREAMS)[PortalResourceStreamKey];

type InitResult =
  | { success: true; created: number }
  | { success: false; error: string };

type TierIds = {
  olevel: string | null;
  alevel: string | null;
};

async function ensureSyllabi(subjectId: string): Promise<TierIds> {
  const supabase = createAdminClient();
  const seed = [
    { subject_id: subjectId, tier: 'olevel', name: 'O-Level', sort_order: 1 },
    { subject_id: subjectId, tier: 'alevel', name: 'A-Level', sort_order: 2 },
  ];
  const { error: upsertError } = await supabase
    .from('syllabi')
    .upsert(seed, { onConflict: 'subject_id,tier', ignoreDuplicates: false });
  if (upsertError) throw new Error(upsertError.message);

  const { data, error } = await supabase
    .from('syllabi')
    .select('id, tier')
    .eq('subject_id', subjectId);
  if (error) throw new Error(error.message);

  return {
    olevel: data?.find((row) => row.tier === 'olevel')?.id ?? null,
    alevel: data?.find((row) => row.tier === 'alevel')?.id ?? null,
  };
}

async function upsertCategory(payload: {
  subject_id: string;
  name: string;
  slug: string;
  sort_order: number;
  parent_id?: string | null;
  syllabus_tier_id?: string | null;
}): Promise<{ created: boolean; id: string | null }> {
  const supabase = createAdminClient();
  const { data: existing, error: lookupError } = await supabase
    .from('categories')
    .select('id')
    .eq('subject_id', payload.subject_id)
    .eq('slug', payload.slug)
    .maybeSingle();
  if (lookupError) throw new Error(lookupError.message);
  if (existing?.id) {
    return { created: false, id: existing.id };
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      ...payload,
      parent_id: payload.parent_id ?? null,
      syllabus_tier_id: payload.syllabus_tier_id ?? null,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return { created: true, id: data?.id ?? null };
}

/**
 * One-click subject bootstrap for empty portals.
 *
 * Creates the **category** tree (O-Level grades, AS/A2 shells, paper slugs) so both
 * public URL families exist: `…/video-lectures` and `…/past-papers`. Those routes
 * load resources filtered by `module_type`; new resources must use
 * {@link PORTAL_RESOURCE_STREAMS} at insert time — provisioning does not insert
 * resource rows or duplicate lane strings.
 */
export async function initSubject(subjectId: string): Promise<InitResult> {
  try {
    const tiers = await ensureSyllabi(subjectId);
    let created = 0;

    for (const [slug, name, order] of [
      ['grade-9', 'Grade 9', 1],
      ['grade-10', 'Grade 10', 2],
      ['grade-11', 'Grade 11', 3],
    ] as const) {
      const result = await upsertCategory({
        subject_id: subjectId,
        slug,
        name,
        sort_order: order,
        syllabus_tier_id: tiers.olevel,
      });
      if (result.created) created += 1;
    }

    const asLevel = await upsertCategory({
      subject_id: subjectId,
      slug: 'as-level',
      name: 'AS Level',
      sort_order: 10,
      syllabus_tier_id: tiers.alevel,
    });
    if (asLevel.created) created += 1;

    const a2Level = await upsertCategory({
      subject_id: subjectId,
      slug: 'a2-level',
      name: 'A2 Level',
      sort_order: 11,
      syllabus_tier_id: tiers.alevel,
    });
    if (a2Level.created) created += 1;

    const paperDefinitions = [
      ['paper-1', 'Paper 1', asLevel.id, 1],
      ['paper-2', 'Paper 2', asLevel.id, 2],
      ['paper-3', 'Paper 3', a2Level.id, 3],
      ['paper-4', 'Paper 4', a2Level.id, 4],
      ['paper-5', 'Paper 5', asLevel.id, 5],
    ] as const;

    for (const [slug, name, parentId, order] of paperDefinitions) {
      if (!parentId) continue;
      const result = await upsertCategory({
        subject_id: subjectId,
        slug,
        name,
        sort_order: order,
        parent_id: parentId,
        syllabus_tier_id: tiers.alevel,
      });
      if (result.created) created += 1;
    }

    return { success: true, created };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialise subject hierarchy.',
    };
  }
}
