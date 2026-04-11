import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/supabase/guards';

// ── GET /api/admin/super/global-stats — Cross-subject aggregate stats ───────
export async function GET() {
  try {
    const session = await requireSuperAdmin();
    if (!session) return NextResponse.json({ error: 'Super-admin access required.' }, { status: 403 });

    const supabase = createAdminClient();

    // Fetch all subjects
    const { data: subjects, error: subErr } = await supabase
      .from('subjects')
      .select('id, name, slug, levels')
      .order('name', { ascending: true });

    if (subErr || !subjects) {
      console.error('[super/global-stats] Subjects error:', subErr);
      return NextResponse.json({ error: 'Failed to fetch subjects.' }, { status: 500 });
    }

    // Count resources per subject
    const stats = await Promise.all(
      subjects.map(async (subject) => {
        const { count: totalResources } = await supabase
          .from('resources')
          .select('*', { count: 'exact', head: true })
          .eq('subject_id', subject.id);

        const { count: publishedResources } = await supabase
          .from('resources')
          .select('*', { count: 'exact', head: true })
          .eq('subject_id', subject.id)
          .eq('is_published', true);

        const { count: videoCount } = await supabase
          .from('resources')
          .select('*', { count: 'exact', head: true })
          .eq('subject_id', subject.id)
          .eq('content_type', 'video');

        const { count: pdfCount } = await supabase
          .from('resources')
          .select('*', { count: 'exact', head: true })
          .eq('subject_id', subject.id)
          .eq('content_type', 'pdf');

        return {
          subject_id: subject.id,
          name: subject.name,
          slug: subject.slug,
          levels: subject.levels,
          total_resources: totalResources ?? 0,
          published_resources: publishedResources ?? 0,
          videos: videoCount ?? 0,
          pdfs: pdfCount ?? 0,
        };
      }),
    );

    // Totals
    const { count: totalAll } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true });

    const { count: totalStudents } = await supabase
      .from('student_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    const { count: totalAdmins } = await supabase
      .from('student_accounts')
      .select('*', { count: 'exact', head: true })
      .ilike('role', 'admin');

    return NextResponse.json({
      subjects: stats,
      totals: {
        resources: totalAll ?? 0,
        students: totalStudents ?? 0,
        admins: totalAdmins ?? 0,
      },
    });
  } catch (err) {
    console.error('[super/global-stats] Error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
