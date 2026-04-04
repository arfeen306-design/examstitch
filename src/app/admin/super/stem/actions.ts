'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const REVALIDATE_PATHS = ['/admin/super/stem', '/stem'];

function revalidateAll() {
  REVALIDATE_PATHS.forEach((p) => revalidatePath(p));
  // Also revalidate all category pages
  revalidatePath('/stem/mathematics');
  revalidatePath('/stem/science');
}

// ═══════════════════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════════════════

export async function createSimulation(payload: {
  title: string;
  slug: string;
  subject: string;
  category: string;
  description?: string;
  instructions?: string;
  icon?: string;
  gradient?: string;
  glow_color?: string;
  difficulty?: string;
  tags?: string[];
  html_code?: string;
  status?: string;
}) {
  const supabase = createAdminClient();

  if (!payload.title.trim() || !payload.slug.trim()) {
    return { success: false, error: 'Title and slug are required.' };
  }
  if (!payload.subject || !['mathematics', 'science'].includes(payload.subject)) {
    return { success: false, error: 'Subject must be "mathematics" or "science".' };
  }

  const slug = payload.slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // Check uniqueness
  const { data: existing } = await supabase
    .from('stem_simulations')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) return { success: false, error: `Simulation with slug "${slug}" already exists.` };

  // Get max sort_order
  const { data: maxRow } = await supabase
    .from('stem_simulations')
    .select('sort_order')
    .eq('subject', payload.subject)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const { error } = await supabase.from('stem_simulations').insert({
    title: payload.title.trim(),
    slug,
    subject: payload.subject,
    category: payload.category?.trim() || 'General',
    description: payload.description?.trim() || '',
    instructions: payload.instructions?.trim() || '',
    icon: payload.icon || 'Sparkles',
    gradient: payload.gradient || 'from-blue-500 to-indigo-600',
    glow_color: payload.glow_color || 'rgba(99,102,241,0.35)',
    difficulty: payload.difficulty || 'Beginner',
    tags: payload.tags || [],
    html_code: payload.html_code || '',
    status: payload.status || 'draft',
    sort_order: (maxRow?.sort_order ?? 0) + 1,
  });

  if (error) return { success: false, error: error.message };

  revalidateAll();
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════════════════

export async function updateSimulation(
  id: string,
  updates: {
    title?: string;
    subject?: string;
    category?: string;
    description?: string;
    instructions?: string;
    icon?: string;
    gradient?: string;
    glow_color?: string;
    difficulty?: string;
    tags?: string[];
    html_code?: string;
    status?: string;
    sort_order?: number;
  },
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('stem_simulations').update(updates).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidateAll();
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════════════════════════

export async function deleteSimulation(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('stem_simulations').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidateAll();
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// TOGGLE STATUS
// ═══════════════════════════════════════════════════════════════════════════

export async function toggleSimulationStatus(id: string, currentStatus: string) {
  const newStatus = currentStatus === 'published' ? 'draft' : 'published';
  return updateSimulation(id, { status: newStatus });
}
