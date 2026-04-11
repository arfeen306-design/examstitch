import { getSubjectLabel } from '@/config/navigation';

/** Admin resource row with joined category + syllabus paper */
export interface AdminResourceRow {
  id: string;
  title: string;
  subject: string;
  subject_id?: string | null;
  syllabus_id?: string | null;
  parent_resource_id?: string | null;
  content_type: string;
  source_url?: string;
  worksheet_url?: string | null;
  module_type?: string;
  sort_order?: number | null;
  question_mapping?: unknown[] | null;
  topic: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
    subject_id?: string | null;
    syllabus_id?: string | null;
    syllabus?: { slug: string; code: string; name?: string } | null;
  } | null;
  is_published: boolean;
  is_locked: boolean;
  is_watermarked: boolean;
  created_at: string;
}

export interface TopicCluster {
  rootId: string;
  baseTitle: string;
  parts: AdminResourceRow[];
}

export interface ModuleBucket {
  categoryId: string;
  categoryName: string;
  topicClusters: TopicCluster[];
}

export interface SyllabusBucket {
  syllabusSlug: string;
  syllabusLabel: string;
  modules: ModuleBucket[];
}

export function getBaseTitle(title: string): string {
  return title
    .replace(/\s*[—–-]\s*Part\s+\d+\s*$/i, '')
    .replace(/\s*\(Part\s+\d+\)\s*$/i, '')
    .replace(/\s+Part\s+\d+\s*$/i, '')
    .trim();
}

function resourceRootId(r: AdminResourceRow, byId: Map<string, AdminResourceRow>): string {
  let cur: AdminResourceRow | undefined = r;
  const seen = new Set<string>();
  while (cur?.parent_resource_id) {
    if (seen.has(cur.id)) break;
    seen.add(cur.id);
    const p = byId.get(cur.parent_resource_id);
    if (!p) break;
    cur = p;
  }
  return cur?.id ?? r.id;
}

function syllabusSlugFromRow(r: AdminResourceRow): string {
  const s = r.category?.syllabus?.slug;
  if (s) return s;
  if (r.syllabus_id) return `id:${r.syllabus_id}`;
  return 'unspecified';
}

function syllabusLabelFromSlug(slug: string): string {
  if (slug === 'unspecified') return 'Syllabus not set';
  if (slug.startsWith('id:')) return 'Syllabus (set category syllabus in DB)';
  return getSubjectLabel(slug);
}

/**
 * Syllabus → module (category) → topic cluster (parent/child resource tree).
 */
export function buildSyllabusModuleTopicHierarchy(resources: AdminResourceRow[]): SyllabusBucket[] {
  const syllabusMap = new Map<string, { label: string; moduleMap: Map<string, AdminResourceRow[]> }>();

  for (const r of resources) {
    const sSlug = syllabusSlugFromRow(r);
    const catId = r.category?.id ?? '__none__';
    if (!syllabusMap.has(sSlug)) {
      syllabusMap.set(sSlug, {
        label: syllabusLabelFromSlug(sSlug),
        moduleMap: new Map(),
      });
    }
    const bucket = syllabusMap.get(sSlug)!;
    if (!bucket.moduleMap.has(catId)) bucket.moduleMap.set(catId, []);
    bucket.moduleMap.get(catId)!.push(r);
  }

  const result: SyllabusBucket[] = [];

  for (const [syllabusSlug, { label, moduleMap }] of syllabusMap) {
    const modules: ModuleBucket[] = [];

    for (const [categoryId, modResources] of moduleMap) {
      const categoryName =
        modResources[0]?.category?.name ?? (categoryId === '__none__' ? 'Uncategorised' : 'Module');

      const byId = new Map(modResources.map(x => [x.id, x]));
      const rootClusters = new Map<string, AdminResourceRow[]>();

      for (const row of modResources) {
        const root = resourceRootId(row, byId);
        if (!rootClusters.has(root)) rootClusters.set(root, []);
        rootClusters.get(root)!.push(row);
      }

      const topicClusters: TopicCluster[] = [];

      for (const [rootId, parts] of rootClusters) {
        const sorted = [...parts].sort((a, b) => {
          if (a.id === rootId) return -1;
          if (b.id === rootId) return 1;
          const ao = a.sort_order ?? 9999;
          const bo = b.sort_order ?? 9999;
          if (ao !== bo) return ao - bo;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        const root = sorted.find(p => p.id === rootId) ?? sorted[0];
        topicClusters.push({
          rootId,
          baseTitle: getBaseTitle(root.title),
          parts: sorted,
        });
      }

      topicClusters.sort((a, b) => a.baseTitle.localeCompare(b.baseTitle));

      modules.push({
        categoryId,
        categoryName,
        topicClusters,
      });
    }

    modules.sort((a, b) => a.categoryName.localeCompare(b.categoryName));

    result.push({
      syllabusSlug,
      syllabusLabel: label,
      modules,
    });
  }

  result.sort((a, b) => a.syllabusLabel.localeCompare(b.syllabusLabel));

  return result;
}

export function filterResourcesBySyllabusSlug(
  resources: AdminResourceRow[],
  filter: 'all' | string,
): AdminResourceRow[] {
  if (filter === 'all') return resources;
  return resources.filter(r => {
    const slug = r.category?.syllabus?.slug ?? null;
    if (slug === filter) return true;
    return false;
  });
}
