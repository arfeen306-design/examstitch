import { O_LEVEL_SUBJECTS, A_LEVEL_SUBJECTS } from '@/config/taxonomy';
import { ADMIN_PORTALS } from '@/config/taxonomy';
import { SUBJECT_TAXONOMY, getProvisionerPapers } from '@/config/taxonomy';

// ─── Subject Metadata ────────────────────────────────────────────────────────
// Maps URL slugs to display info. Derived from SUBJECT_TAXONOMY — adding a
// new subject is a one-file edit in taxonomy.ts (Layer 3 of Phase 2).

export type SubjectMeta = {
  name: string;
  code: string;
  displayCode: string;   // shown in breadcrumbs, e.g. "4024/0580"
  slug: string;
  color: string;         // gradient classes for subject cards
};

/**
 * Historical: A-Level Mathematics used a gold gradient distinct from the blue
 * O-Level Mathematics gradient. Preserved here as an explicit override so SEO
 * pages don't shift colors after the consolidation refactor.
 */
const A_LEVEL_GRADIENT_OVERRIDES: Record<string, string> = {
  'mathematics-9709': 'from-yellow-500 to-amber-600',
};

/**
 * Build the {slug → meta} dict from SUBJECT_TAXONOMY. Each taxonomy entry
 * yields up to two slugs (oLevelSlug + aLevelSlug). We deliberately use the
 * O-Level `displayCode` (e.g. "4024/0580") for the O-Level slug and the bare
 * A-Level code for the A-Level slug — matches the previous hand-rolled table.
 */
export const subjectMeta: Record<string, SubjectMeta> = (() => {
  const map: Record<string, SubjectMeta> = {};
  for (const tax of Object.values(SUBJECT_TAXONOMY)) {
    map[tax.oLevelSlug] = {
      name: tax.name,
      code: tax.oLevelCode,
      displayCode: tax.displayCode,
      slug: tax.oLevelSlug,
      color: tax.gradient,
    };
    if (tax.aLevelSlug && tax.aLevelCode) {
      map[tax.aLevelSlug] = {
        name: tax.name,
        code: tax.aLevelCode,
        displayCode: tax.aLevelCode,
        slug: tax.aLevelSlug,
        color: A_LEVEL_GRADIENT_OVERRIDES[tax.aLevelSlug] ?? tax.gradient,
      };
    }
  }
  return map;
})();

/** Resolve display name from a URL slug, e.g. "Mathematics (4024/0580)" */
export function getSubjectLabel(slug: string): string {
  const meta = subjectMeta[slug];
  if (meta) return `${meta.name} (${meta.displayCode})`;
  // Fallback: title-case the slug
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/** Resolve the short heading, e.g. "Mathematics — 4024/0580" */
export function getSubjectHeading(slug: string): string {
  const meta = subjectMeta[slug];
  if (meta) return `${meta.name} — ${meta.displayCode}`;
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export const mainNavItems = [
  {
    label: 'A-Level',
    href: '/alevel',
  },
  {
    label: 'O-Level / IGCSE',
    href: '/olevel',
  },
  {
    label: 'Pre O-Level',
    href: '/pre-olevel',
  },
  {
    label: 'Digital Skills',
    href: '/digital-skills',
  },
  {
    label: 'My Tutor',
    href: '/tutors',
  },
  {
    label: 'Virtual Lab',
    href: '/stem',
  },
  {
    label: 'Blogs',
    href: '/blog',
  },
  {
    label: 'Contacts',
    href: '/contact',
  },
];

// ─── O-Level Grades (shared by all O-Level subjects) ─────────────────────────

export const oLevelGrades = [
  { label: 'Grade 9', slug: 'grade-9', description: 'Foundation level preparation for IGCSE' },
  { label: 'Grade 10', slug: 'grade-10', description: 'Intermediate O-Level concepts and practice' },
  { label: 'Grade 11', slug: 'grade-11', description: 'Advanced O-Level and exam preparation' },
];

// ─── A-Level Papers (per subject) ────────────────────────────────────────────

export type PaperConfig = { label: string; slug: string; description: string };

export const aLevelPapersBySubject: Record<string, { 'as-level': PaperConfig[]; 'a2-level': PaperConfig[] }> = {
  'mathematics-9709': {
    'as-level': [
      { label: 'Paper 1 — Pure Mathematics', slug: 'paper-1-pure-mathematics', description: 'Algebra, functions, coordinate geometry, calculus' },
      { label: 'Paper 5 — Probability & Statistics', slug: 'paper-5-probability-statistics', description: 'Statistical data, probability, distributions' },
    ],
    'a2-level': [
      { label: 'Paper 3 — Pure Mathematics', slug: 'paper-3-pure-mathematics', description: 'Advanced calculus, differential equations, vectors' },
      { label: 'Paper 4 — Mechanics', slug: 'paper-4-mechanics', description: 'Forces, energy, motion, equilibrium' },
    ],
  },
};

// Phase 4: backfill paper config for any taxonomy entry not explicitly listed
// in the literal above (History, Business, future subjects). Existing literal
// entries take precedence so legacy Math/CS/Physics/Chem/Bio URLs are byte-
// for-byte stable; new subjects pick up taxonomy-derived papers automatically.
for (const tax of Object.values(SUBJECT_TAXONOMY)) {
  if (!tax.aLevelSlug) continue;
  if (aLevelPapersBySubject[tax.aLevelSlug]) continue;
  const cfg = getProvisionerPapers(tax);
  if (cfg) aLevelPapersBySubject[tax.aLevelSlug] = cfg;
}

/** Backward-compatible: return papers for a subject (defaults to Maths) */
export const aLevelPapers = aLevelPapersBySubject['mathematics-9709'];

// ─── Footer (subject-aware; driven by pathname) ─────────────────────────────

export type FooterNavLink = { label: string; href: string };

/**
 * O-Level site slug → paired A-Level slug (Cambridge progression).
 * Derived from SUBJECT_TAXONOMY so a new subject with both syllabi (e.g.
 * History 2147 → 9489, Business 7115 → 9609) is paired automatically — no
 * manual edits needed when adding to taxonomy.ts. Phase 4 Task 1.
 */
export const oLevelToALevelSlug: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const tax of Object.values(SUBJECT_TAXONOMY)) {
    if (tax.oLevelSlug && tax.aLevelSlug) {
      map[tax.oLevelSlug] = tax.aLevelSlug;
    }
  }
  return map;
})();

export const aLevelToOLevelSlug: Record<string, string> = Object.fromEntries(
  Object.entries(oLevelToALevelSlug).map(([o, a]) => [a, o]),
);

export type FooterContext =
  | {
      mode: 'general';
      brandTagline: string;
      oLevelLinks: FooterNavLink[];
      aLevelLinks: FooterNavLink[];
    }
  | {
      mode: 'subject';
      brandTagline: string;
      subjectDisplayName: string;
      olevelSlug: string;
      /** Null when this O-Level subject has no A-Level hub on the site */
      alevelSlug: string | null;
      /** Syllabus code for the A-Level heading, e.g. "9709" */
      aLevelHeadingCode: string;
      oLevelGradeLinks: FooterNavLink[];
      aLevelPaperLinks: FooterNavLink[];
    };

const GENERAL_BRAND =
  'Free O-Level, A-Level & STEM resources — past papers, video lectures, and topical worksheets.';

function buildGradeLinks(olevelSlug: string): FooterNavLink[] {
  return oLevelGrades.map((g) => ({
    label: g.label,
    href: `/olevel/${olevelSlug}/${g.slug}`,
  }));
}

function buildALevelPaperLinks(alevelSlug: string): FooterNavLink[] {
  const cfg = aLevelPapersBySubject[alevelSlug];
  if (!cfg) return [];
  const base = `/alevel/${alevelSlug}`;
  const asLinks = cfg['as-level'].map((p) => ({
    label: `AS — ${p.label}`,
    href: `${base}/as-level/${p.slug}`,
  }));
  const a2Links = cfg['a2-level'].map((p) => ({
    label: `A2 — ${p.label}`,
    href: `${base}/a2-level/${p.slug}`,
  }));
  return [...asLinks, ...a2Links];
}

function generalStemFooter(): FooterContext {
  const oLevelLinks: FooterNavLink[] = O_LEVEL_SUBJECTS.filter((s) => s.active).map((s) => ({
    label: `${s.name} (${s.code})`,
    href: `/olevel/${s.id}`,
  }));
  const aLevelLinks: FooterNavLink[] = A_LEVEL_SUBJECTS.filter((s) => s.active).map((s) => ({
    label: `${s.name} (${s.code})`,
    href: `/alevel/${s.id}`,
  }));
  return {
    mode: 'general',
    brandTagline: GENERAL_BRAND,
    oLevelLinks,
    aLevelLinks,
  };
}

/**
 * Resolves footer columns from the current URL: O-Level and A-Level hubs follow the viewed subject.
 */
export function getFooterContextFromPathname(pathname: string): FooterContext {
  const path = pathname.replace(/\/$/, '') || '/';
  const parts = path.split('/').filter(Boolean);

  // Subject admin portal (/admin/cs, /admin/math, …) → same public hubs as that discipline
  if (parts[0] === 'admin' && parts[1]) {
    const portal = ADMIN_PORTALS.find((p) => p.routeSegment === parts[1]);
    if (portal) {
      const oSlug = portal.taxonomyOLevelPaperSlug;
      const meta = subjectMeta[oSlug];
      const aSlug = oLevelToALevelSlug[oSlug] ?? null;
      const aMeta = aSlug ? subjectMeta[aSlug] : undefined;
      return {
        mode: 'subject',
        brandTagline: meta
          ? `Manage and preview ${meta.name} (${meta.displayCode}) resources — matches the public subject hub.`
          : GENERAL_BRAND,
        subjectDisplayName: meta?.name ?? portal.label,
        olevelSlug: oSlug,
        alevelSlug: aSlug,
        aLevelHeadingCode: aMeta?.displayCode ?? meta?.displayCode ?? '',
        oLevelGradeLinks: buildGradeLinks(oSlug),
        aLevelPaperLinks: aSlug ? buildALevelPaperLinks(aSlug) : [],
      };
    }
  }

  if (parts[0] === 'olevel' && parts[1] && subjectMeta[parts[1]]) {
    const oSlug = parts[1];
    const meta = subjectMeta[oSlug];
    const aSlug = oLevelToALevelSlug[oSlug] ?? null;
    const aMeta = aSlug ? subjectMeta[aSlug] : undefined;
    return {
      mode: 'subject',
      brandTagline: `Free ${meta.name} (${meta.displayCode}) resources for O-Level & IGCSE — past papers, videos, and worksheets.${
        aMeta ? ` Cambridge A-Level (${aMeta.displayCode}) papers and lectures are linked below.` : ''
      }`,
      subjectDisplayName: meta.name,
      olevelSlug: oSlug,
      alevelSlug: aSlug,
      aLevelHeadingCode: aMeta?.displayCode ?? meta.displayCode,
      oLevelGradeLinks: buildGradeLinks(oSlug),
      aLevelPaperLinks: aSlug ? buildALevelPaperLinks(aSlug) : [],
    };
  }

  if (parts[0] === 'tutors') {
    const g = generalStemFooter();
    return {
      ...g,
      brandTagline:
        'Expert tutors for O-Level, A-Level, and university prep — verified scholars for online and in-person sessions across Pakistan, KSA, and the Gulf.',
    };
  }

  if (parts[0] === 'alevel' && parts[1] && subjectMeta[parts[1]]) {
    const aSlug = parts[1];
    const meta = subjectMeta[aSlug];
    const oSlug = aLevelToOLevelSlug[aSlug] ?? null;
    const oMeta = oSlug ? subjectMeta[oSlug] : undefined;
    return {
      mode: 'subject',
      brandTagline: `Free ${meta.name} (${meta.displayCode}) A-Level resources — AS & A2 past papers, video lectures, and topical worksheets.${
        oMeta ? ` O-Level (${oMeta.displayCode}) grades are linked for progression.` : ''
      }`,
      subjectDisplayName: meta.name,
      olevelSlug: oSlug ?? 'mathematics-4024',
      alevelSlug: aSlug,
      aLevelHeadingCode: meta.displayCode,
      oLevelGradeLinks: oSlug ? buildGradeLinks(oSlug) : buildGradeLinks('mathematics-4024'),
      aLevelPaperLinks: buildALevelPaperLinks(aSlug),
    };
  }

  return generalStemFooter();
}
