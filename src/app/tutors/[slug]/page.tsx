import Image from 'next/image';
import { notFound } from 'next/navigation';
import { CheckCircle2, MapPin } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { toEmbedVideoUrl } from '@/lib/tutors';

export const dynamic = 'force-dynamic';

export default async function TutorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: tutor } = await supabase
    .from('tutors')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!tutor) notFound();

  const introEmbed = toEmbedVideoUrl(tutor.video_intro_url);
  const demoEmbed = toEmbedVideoUrl(tutor.video_demo_url);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="rounded-2xl border border-amber-500/40 bg-slate-900 p-6 md:p-8">
        <div className="grid gap-5 md:grid-cols-[180px_1fr]">
          <div className="relative w-40 h-40 rounded-xl overflow-hidden bg-slate-800">
            {tutor.thumbnail_url ? (
              <Image src={tutor.thumbnail_url} alt={tutor.full_name} fill className="object-cover" sizes="160px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No Photo</div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-50">{tutor.full_name}</h1>
            {tutor.hook_intro && <p className="mt-2 text-slate-100">{tutor.hook_intro}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {(tutor.specialties ?? []).map((item: string) => (
                <span key={item} className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-200">{item}</span>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-200">
              <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {(tutor.locations ?? []).join(', ') || 'Online'}</span>
              {tutor.is_verified && <span className="inline-flex items-center gap-1 text-emerald-300"><CheckCircle2 className="w-3 h-3" /> Verified Tutor</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Detailed Bio</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{tutor.detailed_bio || 'Bio will be updated shortly.'}</p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Introduction Video</h3>
          {introEmbed ? (
            <iframe src={introEmbed} className="w-full aspect-video rounded-lg bg-black" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          ) : (
            <p className="text-xs text-[var(--text-muted)]">No intro video added.</p>
          )}
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Teaching Demo</h3>
          {demoEmbed ? (
            <iframe src={demoEmbed} className="w-full aspect-video rounded-lg bg-black" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          ) : (
            <p className="text-xs text-[var(--text-muted)]">No demo video added.</p>
          )}
        </div>
      </section>
    </main>
  );
}
