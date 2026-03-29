/**
 * ExamStitch — Supabase Query Service Layer
 *
 * All database reads go through here. This keeps data fetching logic
 * centralised, type-safe, and easy to extend.
 *
 * Note on generics: supabase-js v2 requires Relationships & CompositeTypes in
 * the Database generic. Our hand-written types in ./types.ts use a simpler
 * shape for readability. We therefore let the client remain un-genericised and
 * cast each result explicitly with `as T` — giving us full type safety in
 * callers without the verbose generated types.
 */

import { createClient } from './server';
import type {
  Level,
  Subject,
  Category,
  Resource,
  ResourceSolution,
  BlogPost,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Levels
// ─────────────────────────────────────────────────────────────────────────────

export async function getLevels(): Promise<Level[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(`getLevels: ${error.message}`);
  return (data ?? []) as Level[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Subjects
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches all subjects for a given level slug (e.g. 'olevel').
 */
export async function getSubjectsByLevelSlug(levelSlug: string): Promise<Subject[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('subjects')
    .select('*, levels!inner ( slug )')
    .eq('levels.slug', levelSlug)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(`getSubjectsByLevelSlug(${levelSlug}): ${error.message}`);
  return (data ?? []) as unknown as Subject[];
}

/**
 * Fetches a single subject by its slug.
 * Example slug: 'mathematics-4024'
 */
export async function getSubjectBySlug(slug: string): Promise<Subject | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error && error.code !== 'PGRST116') {
    throw new Error(`getSubjectBySlug(${slug}): ${error.message}`);
  }
  return (data ?? null) as Subject | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns all top-level categories for a subject (grades or papers).
 */
export async function getCategoriesBySubjectSlug(subjectSlug: string): Promise<Category[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*, subjects!inner ( slug )')
    .eq('subjects.slug', subjectSlug)
    .is('parent_id', null)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(`getCategoriesBySubjectSlug(${subjectSlug}): ${error.message}`);
  return (data ?? []) as unknown as Category[];
}

/**
 * Returns a single category by its slug, joined with its subject.
 * Used by resource pages to get the category_id before fetching resources.
 */
export async function getCategoryBySlug(
  subjectSlug: string,
  categorySlug: string,
): Promise<Category | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*, subjects!inner ( slug )')
    .eq('subjects.slug', subjectSlug)
    .eq('slug', categorySlug)
    .single();
  if (error && error.code !== 'PGRST116') {
    throw new Error(`getCategoryBySlug(${subjectSlug}, ${categorySlug}): ${error.message}`);
  }
  return (data ?? null) as unknown as Category | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resources
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all published resources for a given category.
 * Optionally filter by content_type ('video' | 'pdf' | 'worksheet').
 */
export async function getResourcesByCategory(
  categoryId: string,
  contentType?: 'video' | 'pdf' | 'worksheet',
  moduleType?: 'video_topical' | 'solved_past_paper',
): Promise<Resource[]> {
  const supabase = createClient();

  let query = supabase
    .from('resources')
    .select('*')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (contentType) {
    query = query.eq('content_type', contentType);
  }

  if (moduleType) {
    query = query.eq('module_type', moduleType);
  }

  const { data, error } = await query;
  if (error) throw new Error(`getResourcesByCategory(${categoryId}): ${error.message}`);
  return (data ?? []) as unknown as Resource[];
}

/**
 * Fetches resources for a category filtered by topic name.
 */
export async function getResourcesByTopic(
  categoryId: string,
  topic: string,
): Promise<Resource[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('category_id', categoryId)
    .eq('topic', topic)
    .eq('is_published', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`getResourcesByTopic(${categoryId}, ${topic}): ${error.message}`);
  return (data ?? []) as unknown as Resource[];
}

/**
 * Returns a distinct list of topics with counts for a category.
 * Used to populate the topical index page.
 */
export async function getTopicsByCategory(
  categoryId: string,
): Promise<{ topic: string; count: number }[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('resources')
    .select('topic')
    .eq('category_id', categoryId)
    .eq('is_published', true)
    .not('topic', 'is', null);
  if (error) throw new Error(`getTopicsByCategory(${categoryId}): ${error.message}`);

  const rows = (data ?? []) as { topic: string | null }[];
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    if (row.topic) acc[row.topic] = (acc[row.topic] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => a.topic.localeCompare(b.topic));
}

/**
 * Fetches a single resource by its UUID.
 */
export async function getResourceById(id: string): Promise<Resource | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') {
    throw new Error(`getResourceById(${id}): ${error.message}`);
  }
  return (data ?? null) as unknown as Resource | null;
}

/**
 * Fetches the latest N published resources. Used on the homepage.
 */
export async function getLatestResources(limit = 6): Promise<Resource[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getLatestResources: ${error.message}`);
  return (data ?? []) as unknown as Resource[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Resource Solutions — The Killer Feature
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given a past paper resource ID, returns the question-level video solutions
 * ordered for the sidebar.
 *
 * Each row maps:  question_number + label → timestamp_seconds + video_id
 */
export async function getSolutionsForPaper(paperId: string): Promise<ResourceSolution[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('resource_solutions')
    .select('*')
    .eq('paper_id', paperId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(`getSolutionsForPaper(${paperId}): ${error.message}`);
  return (data ?? []) as unknown as ResourceSolution[];
}

/**
 * Fetches the YouTube video resource linked to a solution.
 * The video's source_url stores the YouTube video ID.
 */
export async function getSolutionVideo(videoResourceId: string): Promise<Resource | null> {
  return getResourceById(videoResourceId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full-text search across resource titles, descriptions, and topics.
 */
export async function searchResources(query: string, limit = 20): Promise<Resource[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('is_published', true)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,topic.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`searchResources(${query}): ${error.message}`);
  return (data ?? []) as unknown as Resource[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Blog
// ─────────────────────────────────────────────────────────────────────────────

export async function getBlogPosts(limit = 10): Promise<BlogPost[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, created_at, is_published, author_id, content, updated_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getBlogPosts: ${error.message}`);
  return (data ?? []) as unknown as BlogPost[];
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  if (error && error.code !== 'PGRST116') {
    throw new Error(`getBlogPostBySlug(${slug}): ${error.message}`);
  }
  return (data ?? null) as unknown as BlogPost | null;
}
