'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function toggleResourceFlag(id: string, field: 'is_published' | 'is_locked' | 'is_watermarked', value: boolean) {
  const supabase = createAdminClient();
  
  const { error } = await supabase
    .from('resources')
    .update({ [field]: value })
    .eq('id', id);

  if (error) {
    console.error(`Failed to toggle ${field} for resource ${id}`, error);
    return { success: false, error: error.message };
  }

  // Revalidate admin and public resource paths
  revalidatePath('/admin/resources');
  revalidatePath('/alevel/[subject]/[level]/[paper]/topical', 'page');
  revalidatePath('/alevel/[subject]/[level]/[paper]/past-papers', 'page');
  revalidatePath('/alevel/[subject]/[level]/[paper]/video-lectures', 'page');
  revalidatePath('/olevel/[subject]/[grade]/topical', 'page');
  revalidatePath('/olevel/[subject]/[grade]/past-papers', 'page');

  return { success: true };
}

export async function bulkInsertResources(resources: any[]) {
  const supabase = createAdminClient();
  
  // Step 1: Discover which columns actually exist in the live database
  const { data: columns } = await supabase
    .from('information_schema.columns' as any)
    .select('column_name')
    .eq('table_name', 'resources')
    .eq('table_schema', 'public');
  
  const existingCols = new Set(
    columns?.map((c: any) => c.column_name) || []
  );
  
  // Step 2: Build payload using ONLY columns that exist in the live table
  const payload = resources.map(res => {
    const item: any = {};
    
    // Always required
    if (existingCols.has('title'))        item.title = res.title;
    if (existingCols.has('source_url'))   item.source_url = res.source_url;
    
    // Conditionally attach every other field
    if (existingCols.has('content_type'))  item.content_type = res.content_type;
    if (existingCols.has('source_type'))   item.source_type = res.source_type;
    if (existingCols.has('subject'))       item.subject = res.subject;
    if (existingCols.has('category_id'))   item.category_id = res.category_id;
    if (existingCols.has('is_watermarked'))item.is_watermarked = res.is_watermarked ?? false;
    if (existingCols.has('is_locked'))     item.is_locked = res.is_locked ?? false;
    if (existingCols.has('is_published'))  item.is_published = res.is_published ?? true;
    if (existingCols.has('description') && res.description) item.description = res.description;
    if (existingCols.has('topic') && res.topic)             item.topic = res.topic;
    
    return item;
  });

  try {
    const { error } = await supabase.from('resources').insert(payload);

    if (error) {
      console.error('Bulk insert failed', error);
      return { success: false, error: `Database rejected the insert: ${error.message}. Please run the schema repair script in the Supabase SQL Editor.` };
    }

    revalidatePath('/admin/resources');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    console.error('Bulk insert exception', err);
    return { success: false, error: 'Could not reach the database. Check your Supabase connection.' };
  }
}

export async function createResource(data: any) {
  const supabase = createAdminClient();
  
  const { error } = await supabase.from('resources').insert([data]);

  if (error) {
    console.error('Failed to create resource', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/resources');
  revalidatePath('/alevel/[subject]/[level]/[paper]/topical', 'page');
  revalidatePath('/alevel/[subject]/[level]/[paper]/past-papers', 'page');
  revalidatePath('/alevel/[subject]/[level]/[paper]/video-lectures', 'page');
  revalidatePath('/olevel/[subject]/[grade]/topical', 'page');
  revalidatePath('/olevel/[subject]/[grade]/past-papers', 'page');
  return { success: true };
}

export async function deleteResource(id: string) {
  const supabase = createAdminClient();
  
  const { error } = await supabase.from('resources').delete().eq('id', id);

  if (error) {
    console.error('Failed to delete resource', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/resources');
  revalidatePath('/alevel/[subject]/[level]/[paper]/topical', 'page');
  revalidatePath('/alevel/[subject]/[level]/[paper]/past-papers', 'page');
  revalidatePath('/alevel/[subject]/[level]/[paper]/video-lectures', 'page');
  revalidatePath('/olevel/[subject]/[grade]/topical', 'page');
  revalidatePath('/olevel/[subject]/[grade]/past-papers', 'page');
  return { success: true };
}

export async function createCategory(payload: { name: string; slug: string; subject_id: string }) {
  const supabase = createAdminClient();
  
  // Create category, we can set sort_order automatically as 99 to put it at the end
  const { error } = await supabase.from('categories').insert([{ ...payload, sort_order: 99 }]);

  if (error) {
    console.error('Failed to create category', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/categories');
  revalidatePath('/', 'layout'); // Extreme cache flush for dynamic taxonomy
  return { success: true };
}

export async function deleteCategoryWithAction(categoryId: string, action: 'cascade' | 'reassign', reassignToId?: string) {
  const supabase = createAdminClient();
  
  if (action === 'reassign' && reassignToId) {
    // 1. Move all resources to new category
    const { error: moveError } = await supabase
      .from('resources')
      .update({ category_id: reassignToId })
      .eq('category_id', categoryId);
      
    if (moveError) {
      return { success: false, error: moveError.message };
    }
  } else if (action === 'cascade') {
    // 1. Delete all resources in this category
    const { error: cascadeError } = await supabase
      .from('resources')
      .delete()
      .eq('category_id', categoryId);
      
    if (cascadeError) {
      return { success: false, error: cascadeError.message };
    }
  }
  
  // 2. Delete the category itself
  const { error: deleteError } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);
    
  if (deleteError) {
    return { success: false, error: deleteError.message };
  }
  
  // Revalidate ALL paths since category hierarchy changed
  revalidatePath('/', 'layout');
  
  return { success: true };
}
