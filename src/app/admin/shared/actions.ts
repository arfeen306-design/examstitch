'use server';

/**
 * Shared admin actions — usable by any subject admin panel (CS, Maths, Physics, etc.)
 *
 * These actions use createAdminClient (service_role) and are NOT subject-scoped.
 * Subject-specific ownership checks should be done in the calling component
 * or by wrapping these in subject-specific actions.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Update a resource's question_mapping (video timestamp mapping).
 *
 * The `question_mapping` column is a JSONB array on the resources table.
 * Each entry maps an exam question to a video timestamp with optional sub-parts.
 *
 * @param resourceId  UUID of the resource
 * @param mapping     Array of question mappings, or null to clear
 */
export async function updateResourceTimestamps(
  resourceId: string,
  mapping: any[] | null,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('resources')
    .update({ question_mapping: mapping })
    .eq('id', resourceId);

  if (error) {
    console.error('[shared/actions] updateResourceTimestamps failed:', error);
    return { success: false, error: error.message };
  }

  revalidateTag('resources');
  return { success: true };
}
