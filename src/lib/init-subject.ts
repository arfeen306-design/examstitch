import { createAdminClient } from '@/lib/supabase/admin';

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
 * Creates Grade 9-11 + Paper 1-5 structure, grouped by O/A-level tiers.
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
