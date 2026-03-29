import { notFound } from 'next/navigation';
import Link from 'next/link';
import PDFViewerLayout from '@/components/resources/PDFViewerLayout';
import { getResourceById, getSolutionsForPaper, getSolutionVideo } from '@/lib/supabase/queries';
import type { ResourceSolution } from '@/lib/supabase/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatGrade(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Converts a Google Drive file ID into a direct embed URL.
 * Drive file IDs look like: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
 */
function driveToEmbedUrl(sourceUrl: string): string {
  // If it's already a full URL, return as-is
  if (sourceUrl.startsWith('http')) return sourceUrl;
  // Otherwise treat it as a Google Drive file ID
  return `https://drive.google.com/file/d/${sourceUrl}/preview`;
}

function driveToDownloadUrl(sourceUrl: string): string {
  if (sourceUrl.startsWith('http')) return sourceUrl;
  return `https://drive.google.com/uc?export=download&id=${sourceUrl}`;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function PaperViewerPage({
  params,
}: {
  params: { subject: string; grade: string; paperSlug: string };
}) {
  const gradeName = formatGrade(params.grade);

  // ── Fetch the paper resource ─────────────────────────────────────────────
  // paperSlug is the resource UUID in production.
  // During development it may be a demo string — we fall back gracefully.
  const paper = await getResourceById(params.paperSlug).catch(() => null);

  // If the ID doesn't exist in the DB yet, show a 404.
  // Remove this guard if you want demo slugs to always work.
  if (!paper) {
    // For development convenience: render a placeholder viewer instead of 404.
    return (
      <DemoViewer
        subject={params.subject}
        grade={params.grade}
        gradeName={gradeName}
        paperSlug={params.paperSlug}
      />
    );
  }

  // ── Fetch solutions and video ────────────────────────────────────────────
  const solutions = await getSolutionsForPaper(paper.id);

  // The first solution's video_id is used for the player (all solutions share one video)
  const videoResourceId = solutions[0]?.video_id ?? null;
  const videoResource = videoResourceId
    ? await getSolutionVideo(videoResourceId)
    : null;

  // Map DB solutions to the component's expected shape
  const solutionItems: ResourceSolution[] = solutions;

  const pdfUrl = driveToEmbedUrl(paper.source_url);
  const downloadUrl = driveToDownloadUrl(paper.source_url);

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Breadcrumb */}
      <div className="bg-navy-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <Link href="/olevel" className="text-white/50 hover:text-white/70 transition-colors">O-Level</Link>
            <span className="text-white/30">/</span>
            <Link href={`/olevel/${params.subject}`} className="text-white/50 hover:text-white/70 transition-colors">Mathematics (4024)</Link>
            <span className="text-white/30">/</span>
            <Link href={`/olevel/${params.subject}/${params.grade}`} className="text-white/50 hover:text-white/70 transition-colors">{gradeName}</Link>
            <span className="text-white/30">/</span>
            <Link href={`/olevel/${params.subject}/${params.grade}/past-papers`} className="text-white/50 hover:text-white/70 transition-colors">Past Papers</Link>
            <span className="text-white/30">/</span>
            <span className="text-gold-500 font-medium">{paper.title}</span>
          </div>
        </div>
      </div>

      {/* Viewer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PDFViewerLayout
          pdfUrl={pdfUrl}
          title={paper.title}
          videoId={videoResource?.source_url}
          videoTitle={videoResource?.title ?? 'Video Solution'}
          solutions={solutionItems}
          downloadUrl={downloadUrl}
        />
      </div>
    </div>
  );
}

// ── Development fallback — shown when paper UUID not found in DB yet ──────────

function DemoViewer({
  subject, grade, gradeName, paperSlug,
}: {
  subject: string; grade: string; gradeName: string; paperSlug: string;
}) {
  // Demo solutions to show the killer feature works visually
  const demoSolutions: ResourceSolution[] = [
    { id: '1', paper_id: paperSlug, video_id: 'v1', question_number: 1, timestamp_seconds: 0,    label: 'Q1 — Number & Operations',    sort_order: 1 },
    { id: '2', paper_id: paperSlug, video_id: 'v1', question_number: 2, timestamp_seconds: 195,  label: 'Q2 — Fractions & Decimals',   sort_order: 2 },
    { id: '3', paper_id: paperSlug, video_id: 'v1', question_number: 3, timestamp_seconds: 420,  label: 'Q3 — Algebra (Equations)',    sort_order: 3 },
    { id: '4', paper_id: paperSlug, video_id: 'v1', question_number: 4, timestamp_seconds: 680,  label: 'Q4 — Geometry (Angles)',      sort_order: 4 },
    { id: '5', paper_id: paperSlug, video_id: 'v1', question_number: 5, timestamp_seconds: 945,  label: 'Q5 — Trigonometry',           sort_order: 5 },
    { id: '6', paper_id: paperSlug, video_id: 'v1', question_number: 6, timestamp_seconds: 1230, label: 'Q6 — Statistics (Mean/Median)',sort_order: 6 },
    { id: '7', paper_id: paperSlug, video_id: 'v1', question_number: 7, timestamp_seconds: 1485, label: 'Q7 — Probability',            sort_order: 7 },
    { id: '8', paper_id: paperSlug, video_id: 'v1', question_number: 8, timestamp_seconds: 1740, label: 'Q8 — Mensuration',            sort_order: 8 },
  ];

  const paperTitle = paperSlug
    .split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    .replace(/P(\d)/, 'Paper $1').replace(/V(\d)/, '— Variant $1');

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="bg-navy-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <Link href="/olevel" className="text-white/50 hover:text-white/70 transition-colors">O-Level</Link>
            <span className="text-white/30">/</span>
            <Link href={`/olevel/${subject}`} className="text-white/50 hover:text-white/70 transition-colors">Mathematics (4024)</Link>
            <span className="text-white/30">/</span>
            <Link href={`/olevel/${subject}/${grade}`} className="text-white/50 hover:text-white/70 transition-colors">{gradeName}</Link>
            <span className="text-white/30">/</span>
            <Link href={`/olevel/${subject}/${grade}/past-papers`} className="text-white/50 hover:text-white/70 transition-colors">Past Papers</Link>
            <span className="text-white/30">/</span>
            <span className="text-gold-500 font-medium">{paperTitle}</span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PDFViewerLayout
          pdfUrl="https://www.africau.edu/images/default/sample.pdf"
          title={`Mathematics 4024 — ${gradeName} — ${paperTitle}`}
          videoId="dQw4w9WgXcQ"
          videoTitle={`${paperTitle} — Full Video Solution`}
          solutions={demoSolutions}
          downloadUrl="https://www.africau.edu/images/default/sample.pdf"
        />
      </div>
    </div>
  );
}
