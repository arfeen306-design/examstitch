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

import { createAdminClient } from './admin';
import { unstable_cache } from 'next/cache';

// Cache revalidation: 1 hour for near-static data, 5 min for resources
const CACHE_1H = 3600;
const CACHE_5M = 300;
import type {
  Level,
  Subject,
  Category,
  Resource,
  ResourceSolution,
  BlogPost,
  UserProgress,
  StudentAccount,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Levels
// ─────────────────────────────────────────────────────────────────────────────

export const getLevels = unstable_cache(
  async (): Promise<Level[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw new Error(`getLevels: ${error.message}`);
    return (data ?? []) as Level[];
  },
  ['levels'],
  { revalidate: CACHE_1H, tags: ['levels'] },
);

// ─────────────────────────────────────────────────────────────────────────────
// Subjects
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches all subjects for a given level slug (e.g. 'olevel').
 */
export async function getSubjectsByLevelSlug(levelSlug: string): Promise<Subject[]> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('subject_papers')
        .select('*, levels!inner ( slug )')
        .eq('levels.slug', levelSlug)
        .order('sort_order', { ascending: true });
      if (error) throw new Error(`getSubjectsByLevelSlug(${levelSlug}): ${error.message}`);
      return (data ?? []) as unknown as Subject[];
    },
    [`subjects-${levelSlug}`],
    { revalidate: CACHE_1H, tags: ['subjects'] },
  )();
}

/**
 * Fetches a single subject_paper by its slug.
 * Example slug: 'mathematics-4024', 'computer-science-0478'
 */
export async function getSubjectBySlug(slug: string): Promise<Subject | null> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('subject_papers')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error && error.code !== 'PGRST116') {
        throw new Error(`getSubjectBySlug(${slug}): ${error.message}`);
      }
      return (data ?? null) as Subject | null;
    },
    [`subject-${slug}`],
    { revalidate: CACHE_1H, tags: ['subjects'] },
  )();
}

// ─────────────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves a subject_papers slug (e.g. 'mathematics-4024') to the parent
 * subjects UUID. After migration 016 categories reference the new subjects table.
 */
async function resolveSubjectId(supabase: ReturnType<typeof createAdminClient>, paperSlug: string): Promise<string | null> {
  const { data } = await supabase
    .from('subject_papers')
    .select('parent_subject_id')
    .eq('slug', paperSlug)
    .single();
  return data?.parent_subject_id ?? null;
}

/**
 * Returns all top-level categories for a subject (grades or papers).
 */
export async function getCategoriesBySubjectSlug(subjectSlug: string): Promise<Category[]> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
      const parentId = await resolveSubjectId(supabase, subjectSlug);
      if (!parentId) return [];
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('subject_id', parentId)
        .is('parent_id', null)
        .order('sort_order', { ascending: true });
      if (error) throw new Error(`getCategoriesBySubjectSlug(${subjectSlug}): ${error.message}`);
      return (data ?? []) as unknown as Category[];
    },
    [`categories-${subjectSlug}`],
    { revalidate: CACHE_5M, tags: ['categories'] },
  )();
}

/**
 * Returns a single category by its slug, joined with its subject.
 * Used by resource pages to get the category_id before fetching resources.
 */
export async function getCategoryBySlug(
  subjectSlug: string,
  categorySlug: string,
): Promise<Category | null> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
      const parentId = await resolveSubjectId(supabase, subjectSlug);
      if (!parentId) return null;
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('subject_id', parentId)
        .eq('slug', categorySlug)
        .single();
      if (error && error.code !== 'PGRST116') {
        throw new Error(`getCategoryBySlug(${subjectSlug}, ${categorySlug}): ${error.message}`);
      }
      return (data ?? null) as unknown as Category | null;
    },
    [`category-${subjectSlug}-${categorySlug}`],
    { revalidate: CACHE_5M, tags: ['categories'] },
  )();
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
  const cacheKey = `resources-${categoryId}-${contentType ?? 'all'}-${moduleType ?? 'all'}`;
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();

      let query = supabase
        .from('resources')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_published', true)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (contentType) query = query.eq('content_type', contentType);
      if (moduleType)  query = query.eq('module_type', moduleType);

      const { data, error } = await query;
      if (error) throw new Error(`getResourcesByCategory(${categoryId}): ${error.message}`);
      return (data ?? []) as unknown as Resource[];
    },
    [cacheKey],
    { revalidate: CACHE_5M, tags: ['resources'] },
  )();
}

/**
 * Fetches resources for a category filtered by topic name.
 */
export async function getResourcesByTopic(
  categoryId: string,
  topic: string,
): Promise<Resource[]> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('category_id', categoryId)
        .eq('topic', topic)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (error) throw new Error(`getResourcesByTopic(${categoryId}, ${topic}): ${error.message}`);
      return (data ?? []) as unknown as Resource[];
    },
    [`resources-topic-${categoryId}-${topic}`],
    { revalidate: CACHE_1H, tags: ['resources'] },
  )();
}

/**
 * Returns a distinct list of topics with counts for a category.
 * Used to populate the topical index page.
 */
export async function getTopicsByCategory(
  categoryId: string,
): Promise<{ topic: string; count: number }[]> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
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
    },
    [`topics-${categoryId}`],
    { revalidate: CACHE_5M, tags: ['resources'] },
  )();
}

/**
 * Fetches a single resource by its UUID.
 */
export async function getResourceById(id: string): Promise<Resource | null> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('id', id)
        .single();
      if (error && error.code !== 'PGRST116') {
        throw new Error(`getResourceById(${id}): ${error.message}`);
      }
      return (data ?? null) as unknown as Resource | null;
    },
    [`resource-${id}`],
    { revalidate: CACHE_1H, tags: ['resources'] },
  )();
}

/**
 * Fetches the latest N published resources. Used on the homepage.
 */
export async function getLatestResources(limit = 6): Promise<Resource[]> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw new Error(`getLatestResources: ${error.message}`);
      return (data ?? []) as unknown as Resource[];
    },
    [`latest-resources-${limit}`],
    { revalidate: CACHE_1H, tags: ['resources'] },
  )();
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
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('resource_solutions')
        .select('*')
        .eq('paper_id', paperId)
        .order('sort_order', { ascending: true });
      if (error) throw new Error(`getSolutionsForPaper(${paperId}): ${error.message}`);
      return (data ?? []) as unknown as ResourceSolution[];
    },
    [`solutions-${paperId}`],
    { revalidate: CACHE_5M, tags: ['resources'] },
  )();
}

/**
 * Fetches the YouTube video resource linked to a solution.
 * The video's source_url stores the YouTube video ID.
 */
export async function getSolutionVideo(videoResourceId: string): Promise<Resource | null> {
  return getResourceById(videoResourceId);
}

// ─────────────────────────────────────────────────────────────────────────────
// User Progress
// ─────────────────────────────────────────────────────────────────────────────

export type UserProgressWithResource = UserProgress & { resource: Resource };

export async function getUserProgress(userId: string): Promise<UserProgressWithResource[]> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('user_progress')
        .select('*, resource:resources(*)')
        .eq('user_id', userId)
        .order('last_viewed_at', { ascending: false });
      if (error) throw new Error(`getUserProgress(${userId}): ${error.message}`);
      return (data ?? []) as unknown as UserProgressWithResource[];
    },
    [`user-progress-${userId}`],
    { revalidate: 60, tags: [`progress-${userId}`] }, // Short cache for progress
  )();
}

export async function getStudentAccount(userId: string): Promise<StudentAccount | null> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('student_accounts')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') {
        throw new Error(`getStudentAccount(${userId}): ${error.message}`);
      }
      return (data ?? null) as StudentAccount | null;
    },
    [`student-account-${userId}`],
    { revalidate: CACHE_1H, tags: [`student-${userId}`] },
  )();
}

export async function getStudentAccountByEmail(email: string): Promise<StudentAccount | null> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
          .from('student_accounts')
          .select('*')
          .eq('email', email.trim().toLowerCase())
          .single();
        if (error && error.code !== 'PGRST116') {
          throw new Error(`getStudentAccountByEmail(${email}): ${error.message}`);
        }

      return (data ?? null) as StudentAccount | null;
    },
    [`student-account-email-${email.toLowerCase()}`],
    { revalidate: CACHE_1H },
  )();
}

/**
 * Maps Supabase Auth ID (UUID) to Student Account ID (if they match).
 * In this project, student_accounts.id is the primary key.
 */
export async function getStudentAccountByAuthId(authId: string): Promise<StudentAccount | null> {
  return getStudentAccount(authId);
}

/**
 * Counts total published resources for a given level (e.g. 'olevel', 'alevel').
 * Joins through categories -> subjects -> levels.
 */
export async function countResourcesByLevel(levelSlug: string): Promise<number> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
      const { count, error } = await supabase
        .from('resources')
        .select('*, category:categories!inner(subject:subject_papers!inner(level:levels!inner(slug)))', { count: 'exact', head: true })
        .eq('is_published', true)
        .eq('category.subject.level.slug', levelSlug);
      
      if (error) throw new Error(`countResourcesByLevel(${levelSlug}): ${error.message}`);
      return count ?? 0;
    },
    [`resource-count-${levelSlug}`],
    { revalidate: CACHE_1H, tags: ['resources'] },
  )();
}


// ─────────────────────────────────────────────────────────────────────────────
// Subject Resource Counts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Counts total published resources for a given subject_papers slug
 * (e.g. 'mathematics-4024', 'computer-science-9618').
 * Joins: resources → categories → subjects ← subject_papers.
 */
export async function countResourcesBySubjectSlug(paperSlug: string): Promise<number> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
      const parentId = await resolveSubjectId(supabase, paperSlug);
      if (!parentId) return 0;

      const { count, error } = await supabase
        .from('resources')
        .select('*, category:categories!inner(subject_id)', { count: 'exact', head: true })
        .eq('is_published', true)
        .eq('category.subject_id', parentId);

      if (error) throw new Error(`countResourcesBySubjectSlug(${paperSlug}): ${error.message}`);
      return count ?? 0;
    },
    [`resource-count-subject-${paperSlug}`],
    { revalidate: CACHE_1H, tags: ['resources'] },
  )();
}

/**
 * Batch-counts resources for multiple subject_papers slugs.
 * Returns a map of slug → count.
 */
export async function countResourcesForSubjects(slugs: string[]): Promise<Record<string, number>> {
  const entries = await Promise.all(
    slugs.map(async (slug) => [slug, await countResourcesBySubjectSlug(slug)] as const),
  );
  return Object.fromEntries(entries);
}

// ─────────────────────────────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full-text search across resource titles, descriptions, and topics.
 *
 * Uses the `fts` generated tsvector column (see migration 009) so queries
 * hit the GIN index instead of doing a sequential ILIKE scan.
 * Requires migration 009_add_fts_column.sql to be applied in Supabase.
 */
/**
 * Full-text search across resource titles, descriptions, and topics.
 *
 * 3-tier strategy:
 *  Tier 1 — FTS websearch_to_tsquery (fast, stemmed, handles natural language)
 *  Tier 2 — Broad ILIKE on full query string (catches exact substrings)
 *  Tier 3 — Per-word prefix ILIKE (catches abbreviations like "Diff" for "Differentiation")
 */
export async function searchResources(query: string, limit = 60): Promise<Resource[]> {
  const trimmed = query.trim().slice(0, 120);
  if (!trimmed) return [];

  return unstable_cache(
    async () => {
      const supabase = createAdminClient();

      const orderOpts = [
        { column: 'sort_order', ascending: true, nullsFirst: false },
        { column: 'created_at', ascending: false },
      ] as const;

      // ── Tier 1: FTS ─────────────────────────────────────────────────────────
      try {
        const { data: ftsData, error: ftsErr } = await supabase
          .from('resources')
          .select('*, category:categories(id, name, slug)')
          .eq('is_published', true)
          .textSearch('fts', trimmed, { config: 'english', type: 'websearch' })
          .order(orderOpts[0].column, { ascending: orderOpts[0].ascending, nullsFirst: orderOpts[0].nullsFirst })
          .order(orderOpts[1].column, { ascending: orderOpts[1].ascending })
          .limit(limit);

        if (!ftsErr && ftsData && ftsData.length > 0) {
          return ftsData as unknown as Resource[];
        }
      } catch (_) { /* fall through */ }

      // ── Tier 2: Full ILIKE on raw query ───────────────────────────────────
      const safe = trimmed.replace(/[%_]/g, '\\$&');
      try {
        const { data: ilikeData, error: ilikeErr } = await supabase
          .from('resources')
          .select('*, category:categories(id, name, slug)')
          .eq('is_published', true)
          .or(`title.ilike.%${safe}%,description.ilike.%${safe}%,topic.ilike.%${safe}%`)
          .order(orderOpts[0].column, { ascending: orderOpts[0].ascending, nullsFirst: orderOpts[0].nullsFirst })
          .order(orderOpts[1].column, { ascending: orderOpts[1].ascending })
          .limit(limit);

        if (!ilikeErr && ilikeData && ilikeData.length > 0) {
          return ilikeData as unknown as Resource[];
        }
      } catch (_) { /* fall through */ }

      // ── Tier 3: Per-word prefix ILIKE ─────────────────────────────────────
      // Splits "Differentiation Rules" → ["diff", "rule"] and does an OR ILIKE
      // so "Diff (2026)" matches "Differentiation". Min prefix length = 3 chars.
      const prefixes = trimmed
        .split(/\s+/)
        .map(w => w.replace(/[%_]/g, '\\$&').slice(0, 6)) // first 6 chars per word
        .filter(w => w.length >= 3);

      if (prefixes.length > 0) {
        const orClause = prefixes
          .map(p => `title.ilike.%${p}%`)
          .join(',');

        const { data: prefixData, error: prefixErr } = await supabase
          .from('resources')
          .select('*, category:categories(id, name, slug)')
          .eq('is_published', true)
          .or(orClause)
          .order(orderOpts[0].column, { ascending: orderOpts[0].ascending, nullsFirst: orderOpts[0].nullsFirst })
          .order(orderOpts[1].column, { ascending: orderOpts[1].ascending })
          .limit(limit);

        if (!prefixErr) return (prefixData ?? []) as unknown as Resource[];
      }

      return [];
    },
    [`search-${trimmed}-${limit}`],
    { revalidate: CACHE_5M, tags: ['resources'] },
  )();
}

/**
 * Returns up to `count` real resource titles from the DB that partially match
 * the user's query. Used for "Try searching for" suggestions on zero-results.
 * Only returns titles whose prefix matches at least one word in the query.
 */
export async function getSuggestions(query: string, count = 6): Promise<string[]> {
  const trimmed = query.trim().slice(0, 60);
  if (!trimmed) return [];

  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
      // Take first 3 chars of the query as a loose prefix
      const prefix = trimmed.slice(0, 3).replace(/[%_]/g, '\\$&');

      const { data } = await supabase
        .from('resources')
        .select('title')
        .eq('is_published', true)
        .ilike('title', `${prefix}%`)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .limit(count * 3); // fetch more, dedupe by base title below

      if (!data) return [];

      // Deduplicate by stripping year/part suffixes, then return unique base titles
      const seen = new Set<string>();
      const results: string[] = [];
      for (const row of data) {
        const base = row.title
          .replace(/\s*\(\d{4}\)\s*/g, '') // strip (2026)
          .replace(/\s*[—–-]\s*Part\s+\d+\s*$/i, '') // strip — Part 2
          .replace(/\s+Part\s+\d+\s*$/i, '')
          .trim();
        if (!seen.has(base) && base.toLowerCase() !== trimmed.toLowerCase()) {
          seen.add(base);
          results.push(base);
          if (results.length >= count) break;
        }
      }
      return results;
    },
    [`suggestions-${trimmed}-${count}`],
    { revalidate: CACHE_5M, tags: ['resources'] },
  )();
}

/**
 * Categorised search — returns results split into content-type buckets.
 */
export interface CategorisedResults {
  videoTopical: Resource[];
  solvedPapers: Resource[];
  total: number;
}

export async function searchResourcesCategorised(query: string): Promise<CategorisedResults> {
  const all = await searchResources(query, 80);
  return {
    videoTopical: all.filter(r => (r as any).module_type === 'video_topical' || r.content_type === 'video'),
    solvedPapers: all.filter(r => (r as any).module_type === 'solved_past_paper' || r.content_type === 'pdf'),
    total: all.length,
  };
}



// ─────────────────────────────────────────────────────────────────────────────
// Blog
// ─────────────────────────────────────────────────────────────────────────────

export async function getBlogPosts(limit = 10): Promise<BlogPost[]> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, created_at, is_published, author_id, content, updated_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw new Error(`getBlogPosts: ${error.message}`);
      return (data ?? []) as unknown as BlogPost[];
    },
    [`blog-posts-${limit}`],
    { revalidate: CACHE_1H, tags: ['blog'] },
  )();
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
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
    },
    [`blog-post-${slug}`],
    { revalidate: CACHE_1H, tags: ['blog'] },
  )();
}
