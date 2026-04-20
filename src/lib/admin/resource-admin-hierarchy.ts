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
    syllabus_tier_id?: string | null;
    syllabus?: { slug: string; code: string; name?: string } | null;
    syllabus_tier?: { id: string; tier: string; name: string } | null;
    /** AS Level / A2 Level / Grade row when this category is a leaf paper or grade */
    parent?: { id: string; name: string; slug: string } | null;
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
  const paper = r.category?.syllabus?.slug;
  if (paper) return paper;
  const tier = r.category?.syllabus_tier?.tier;
  if (tier === 'alevel') return 'tier:alevel';
  if (tier === 'olevel') return 'tier:olevel';
  if (r.syllabus_id) return `id:${r.syllabus_id}`;
  return 'unspecified';
}

function syllabusLabelFromSlug(slug: string): string {
  if (slug === 'tier:olevel') return 'O-Level';
  if (slug === 'tier:alevel') return 'A-Level';
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

    result.push({
      syllabusSlug,
      syllabusLabel: label,
      modules: sortModulesWithinSyllabusBucket(modules),
    });
  }

  result.sort(sortSyllabusBucketsForAdmin);

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
    if (filter === 'tier:olevel' && r.category?.syllabus_tier?.tier === 'olevel') return true;
    if (filter === 'tier:alevel' && r.category?.syllabus_tier?.tier === 'alevel') return true;
    return false;
  });
}

/** Sort O-Level programme buckets before A-Level / 9709-style papers for admin tables */
export function sortSyllabusBucketsForAdmin(a: SyllabusBucket, b: SyllabusBucket): number {
  const rank = (slug: string) => {
    if (slug === 'tier:olevel') return 0;
    if (/4024|0580|5054|5070|5090|0478|1123|2059|3248|5054/i.test(slug)) return 1;
    if (slug === 'tier:alevel') return 2;
    if (/9709|9702|9618|9701|9700/i.test(slug)) return 3;
    if (slug === 'unspecified') return 99;
    return 5;
  };
  const d = rank(a.syllabusSlug) - rank(b.syllabusSlug);
  if (d !== 0) return d;
  return a.syllabusLabel.localeCompare(b.syllabusLabel);
}

function moduleRank(slug: string): number {
  if (/^grade-9$/i.test(slug)) return 1;
  if (/^grade-10$/i.test(slug)) return 2;
  if (/^grade-11$/i.test(slug)) return 3;
  if (/^as-level$/i.test(slug)) return 10;
  if (/^a2-level$/i.test(slug)) return 11;
  return 50;
}

/** Within one syllabus bucket: grades → AS/A2 roots → paper leaves (by slug) */
export function sortModulesWithinSyllabusBucket(modules: ModuleBucket[]): ModuleBucket[] {
  return [...modules].sort((a, b) => {
    const sa = a.topicClusters[0]?.parts[0]?.category?.slug ?? '';
    const sb = b.topicClusters[0]?.parts[0]?.category?.slug ?? '';
    const ra = moduleRank(sa) - moduleRank(sb);
    if (ra !== 0) return ra;
    return a.categoryName.localeCompare(b.categoryName);
  });
}

/**
 * One-line header mirroring public portal hierarchy:
 * `Mathematics (9709) → AS Level → Paper 1 …` or `Mathematics (4024/0580) → Grade 11`.
 */
export function formatAdminModuleGroupHeader(
  disciplineName: string,
  syllabusBucket: SyllabusBucket,
  module: ModuleBucket,
): string {
  const anchor = module.topicClusters[0]?.parts[0];
  const cat = anchor?.category;
  const paper = cat?.syllabus;
  const parent = cat?.parent;

  let programme = disciplineName;
  const code = paper?.code?.trim();
  if (code) {
    programme = `${disciplineName} (${code})`;
  } else if (paper?.slug) {
    const digits = paper.slug.match(/(\d{4})/g);
    const last = digits?.[digits.length - 1];
    if (last === '9709') programme = `${disciplineName} (9709)`;
    else if (last === '4024' || last === '0580') programme = `${disciplineName} (4024/0580)`;
    else if (last) programme = `${disciplineName} (${last})`;
    else programme = `${disciplineName} — ${paper.name ?? paper.slug}`;
  } else if (syllabusBucket.syllabusSlug === 'tier:olevel') {
    programme = `${disciplineName} (O-Level)`;
  } else if (syllabusBucket.syllabusSlug === 'tier:alevel') {
    programme = `${disciplineName} (A-Level)`;
  }

  const mid = parent?.name ? `${parent.name} → ` : '';
  return `${programme} → ${mid}${module.categoryName}`;
}

/** Table section chrome: visually separate O-Level block from A-Level / 9709 block */
export function adminSyllabusSectionClass(syllabusSlug: string): string {
  const isOLane =
    syllabusSlug === 'tier:olevel' ||
    /4024|0580|5054|5070|5090|0478|1123|2059|3248/i.test(syllabusSlug);
  if (isOLane) {
    return 'border-t-4 border-t-cyan-500/50 bg-cyan-950/10 [&>tr.section-label>td]:bg-cyan-950/40';
  }
  return 'border-t-4 border-t-indigo-500/45 bg-indigo-950/10 [&>tr.section-label>td]:bg-indigo-950/35';
}

export function adminSyllabusSectionLabel(syllabusSlug: string): string {
  const isOLane =
    syllabusSlug === 'tier:olevel' ||
    /4024|0580|5054|5070|5090|0478|1123|2059|3248/i.test(syllabusSlug);
  return isOLane ? 'O-Level / IGCSE programme' : 'A-Level programme';
}
