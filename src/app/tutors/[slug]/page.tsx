import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, MapPin, Sparkles } from 'lucide-react';
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
    .eq('is_verified', true)
    .maybeSingle();

  if (!tutor) notFound();

  const introEmbed = toEmbedVideoUrl(tutor.video_intro_url);
  const demoEmbed = toEmbedVideoUrl(tutor.video_demo_url);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060b14]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(251,191,36,0.14),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,rgba(59,130,246,0.08),transparent_50%)]"
        aria-hidden
      />

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/tutors"
          className="mb-8 inline-flex items-center gap-2 text-sm text-amber-200/90 transition hover:text-amber-100"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All tutors
        </Link>

        <section className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-[#0a1020] p-6 shadow-[0_0_80px_rgba(251,191,36,0.06)] sm:p-8 md:p-10">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"
            aria-hidden
          />
          <div className="relative grid gap-8 md:grid-cols-[200px_1fr] md:gap-10">
            <div className="mx-auto md:mx-0">
              <div className="relative h-44 w-44 overflow-hidden rounded-2xl border border-white/10 bg-slate-800 shadow-lg ring-1 ring-amber-500/20 sm:h-48 sm:w-48">
                {tutor.thumbnail_url ? (
                  <Image
                    src={tutor.thumbnail_url}
                    alt={tutor.full_name}
                    fill
                    className="object-cover"
                    sizes="200px"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-800/80 text-xs text-slate-400">
                    Photo coming soon
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 text-center md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/95">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
                My Tutor
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">{tutor.full_name}</h1>
              {tutor.hook_intro && (
                <p className="mt-3 text-lg leading-relaxed text-slate-200/95">{tutor.hook_intro}</p>
              )}
              <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                {(tutor.specialties ?? []).map((item: string) => (
                  <span
                    key={item}
                    className="rounded-full border border-amber-500/25 bg-amber-500/[0.12] px-3 py-1 text-xs font-medium text-amber-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-300 md:justify-start">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0 text-amber-400/80" aria-hidden />
                  {(tutor.locations ?? []).length > 0 ? (tutor.locations ?? []).join(', ') : 'Online & flexible'}
                </span>
                {tutor.is_verified && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Verified tutor
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
          <h2 className="text-lg font-semibold text-slate-100">About</h2>
          <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-slate-300/95">
            {tutor.detailed_bio?.trim() || 'A full biography will appear here soon.'}
          </p>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.08] bg-[var(--bg-card)]/80 p-5 sm:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Introduction</h3>
            <p className="mt-1 text-xs text-slate-500">Preview or stream</p>
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/40">
              {introEmbed ? (
                <iframe
                  title="Introduction video"
                  src={introEmbed}
                  className="aspect-video w-full bg-black"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex aspect-video items-center justify-center text-sm text-slate-500">
                  No intro video yet.
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[var(--bg-card)]/80 p-5 sm:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Teaching demo</h3>
            <p className="mt-1 text-xs text-slate-500">Sample lesson or style</p>
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/40">
              {demoEmbed ? (
                <iframe
                  title="Teaching demo video"
                  src={demoEmbed}
                  className="aspect-video w-full bg-black"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex aspect-video items-center justify-center text-sm text-slate-500">
                  No demo video yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
