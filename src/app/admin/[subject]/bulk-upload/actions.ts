'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSession } from '@/lib/supabase/guards';
import { revalidateTag } from 'next/cache';
import { CONTENT_TYPES, MODULE_TYPES } from '@/lib/constants';

interface ValidRow {
  title: string;
  source_url: string;
  content_type: string;
  module_type: string;
  category_slug: string;
  sort_order: number;
}

const VALID_CONTENT_TYPES = new Set<string>([CONTENT_TYPES.VIDEO, CONTENT_TYPES.PDF]);
const VALID_MODULE_TYPES = new Set<string>([MODULE_TYPES.VIDEO_TOPICAL, MODULE_TYPES.SOLVED_PAST_PAPER]);

export async function bulkCreateResources(
  rows: ValidRow[],
  subjectId: string
): Promise<{ inserted: number; errors: { row: number; message: string }[] }> {
  const session = await getAdminSession();
  if (!session) {
    return { inserted: 0, errors: [{ row: 0, message: 'Not authenticated' }] };
  }

  if (!session.isSuperAdmin && !session.managedSubjects.includes(subjectId)) {
    return { inserted: 0, errors: [{ row: 0, message: 'Access denied for this subject' }] };
  }

  const supabase = createAdminClient();

  // Resolve category slugs to IDs
  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug')
    .eq('subject_id', subjectId);

  const slugToId = new Map((categories ?? []).map(c => [c.slug, c.id]));

  // Server-side validation
  const errors: { row: number; message: string }[] = [];
  const validInserts: {
    title: string;
    source_url: string;
    content_type: string;
    module_type: string;
    category_id: string;
    subject_id: string;
    sort_order: number;
    source_type: string;
    subject: string;
    is_published: boolean;
    is_locked: boolean;
    is_watermarked: boolean;
  }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2; // CSV row number (1-indexed + header)

    if (!r.title?.trim()) {
      errors.push({ row: rowNum, message: 'Title is required' });
      continue;
    }
    if (!r.source_url?.trim()) {
      errors.push({ row: rowNum, message: 'Source URL is required' });
      continue;
    }
    try {
      const url = new URL(r.source_url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push({ row: rowNum, message: 'Invalid URL protocol' });
        continue;
      }
    } catch {
      errors.push({ row: rowNum, message: 'Invalid URL' });
      continue;
    }
    if (!VALID_CONTENT_TYPES.has(r.content_type)) {
      errors.push({ row: rowNum, message: `Invalid content_type: ${r.content_type}` });
      continue;
    }
    if (!VALID_MODULE_TYPES.has(r.module_type)) {
      errors.push({ row: rowNum, message: `Invalid module_type: ${r.module_type}` });
      continue;
    }

    const categoryId = slugToId.get(r.category_slug);
    if (!categoryId) {
      errors.push({ row: rowNum, message: `Unknown category_slug: ${r.category_slug}` });
      continue;
    }

    const sourceType = r.source_url.includes('youtu') ? 'youtube' : 'google_drive';

    validInserts.push({
      title: r.title.trim(),
      source_url: r.source_url.trim(),
      content_type: r.content_type,
      module_type: r.module_type,
      category_id: categoryId,
      subject_id: subjectId,
      sort_order: r.sort_order || 0,
      source_type: sourceType,
      subject: '', // Legacy field
      is_published: true,
      is_locked: false,
      is_watermarked: false,
    });
  }

  if (validInserts.length === 0) {
    return { inserted: 0, errors: errors.length > 0 ? errors : [{ row: 0, message: 'No valid rows to insert' }] };
  }

  // Single batch insert
  const { error: insertError } = await supabase.from('resources').insert(validInserts);

  if (insertError) {
    return { inserted: 0, errors: [{ row: 0, message: insertError.message }] };
  }

  revalidateTag('resources');

  return { inserted: validInserts.length, errors };
}
