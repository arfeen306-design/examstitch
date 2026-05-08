// Server-only module: imports `node:fs` and reads from disk, so this file
// must never be imported from a client component. (We rely on convention
// rather than the `server-only` package because its lack of TS types
// would force a //@ts-ignore.)
import fs from 'node:fs';
import path from 'node:path';

export interface WorksheetEntry {
  /** Grade folder, e.g. "grade-9" */
  grade: string;
  /** URL slug used in /topical/[topic], e.g. "numbers" */
  slug: string;
  /** Display name shown on the topic card, e.g. "Numbers" */
  topic: string;
  /** Absolute filesystem path to the .md file */
  filePath: string;
  /** Number of questions in the worksheet (read once at module load) */
  questionCount: number;
}

const WORKSHEETS_DIR = path.join(process.cwd(), 'docs', 'worksheets', 'olevel-math');

/**
 * Maps a `01-numbers` filename stem to the human-readable display label.
 * Topic display names come from the H2 line of each worksheet — but
 * keeping this map static avoids any IO during card render.
 */
const TOPIC_LABELS: Record<string, string> = {
  // Grade 9
  '01-numbers':                 'Numbers',
  '02-algebra':                 'Algebra',
  '03-coordinate-geometry':     'Coordinate Geometry',
  '04-geometry':                'Geometry — Angles & Polygons',
  '05-mensuration':             'Mensuration — Perimeter & Area',
  '06-statistics':              'Statistics — Data Handling',
  // Grade 10
  '01-indices-surds':           'Indices, Surds & Standard Form',
  '02-quadratic-equations':     'Quadratic Equations',
  '03-simultaneous-equations':  'Simultaneous Equations',
  '04-trigonometry':            'Trigonometry',
  '05-mensuration-3d':          'Mensuration — Volume & Surface Area',
  '06-probability':             'Probability',
  '07-sets-venn':               'Sets & Venn Diagrams',
  // Grade 11
  '01-functions-transformations': 'Functions & Transformations',
  '02-differentiation':           'Differentiation',
  '03-integration':               'Integration',
  '04-advanced-trigonometry':     'Sine & Cosine Rules',
  '05-vectors-matrices':          'Vectors & Matrices',
  '06-cumulative-frequency':      'Cumulative Frequency & Box Plots',
  '07-conditional-probability':   'Conditional Probability',
};

function deriveSlug(stem: string): string {
  // Strip leading "01-" / "02-" ordering prefix.
  return stem.replace(/^\d+-/, '');
}

function countQuestions(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/^\*\*Question \d+\*\*/gm);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Reads the docs/worksheets/olevel-math/<grade>/ directory and returns the
 * sorted list of worksheets. Cached at module-init time — no IO per request.
 */
let CACHE: Record<string, WorksheetEntry[]> | null = null;

function buildCache(): Record<string, WorksheetEntry[]> {
  const out: Record<string, WorksheetEntry[]> = {};
  if (!fs.existsSync(WORKSHEETS_DIR)) return out;

  for (const grade of fs.readdirSync(WORKSHEETS_DIR)) {
    const gradeDir = path.join(WORKSHEETS_DIR, grade);
    if (!fs.statSync(gradeDir).isDirectory()) continue;

    const entries: WorksheetEntry[] = fs
      .readdirSync(gradeDir)
      .filter((f) => f.endsWith('.md'))
      .sort()
      .map((filename) => {
        const stem = filename.replace(/\.md$/, '');
        const slug = deriveSlug(stem);
        const filePath = path.join(gradeDir, filename);
        return {
          grade,
          slug,
          topic: TOPIC_LABELS[stem] ?? slug.replace(/-/g, ' '),
          filePath,
          questionCount: countQuestions(filePath),
        };
      });

    out[grade] = entries;
  }
  return out;
}

function getCache(): Record<string, WorksheetEntry[]> {
  if (!CACHE) CACHE = buildCache();
  return CACHE;
}

export function getWorksheetsForGrade(grade: string): WorksheetEntry[] {
  return getCache()[grade] ?? [];
}

export function getWorksheetBySlug(grade: string, slug: string): WorksheetEntry | null {
  return getWorksheetsForGrade(grade).find((w) => w.slug === slug) ?? null;
}

export function loadWorksheetMarkdown(entry: WorksheetEntry): string {
  return fs.readFileSync(entry.filePath, 'utf8');
}
