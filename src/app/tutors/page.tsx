import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import ConstellationBackground from '@/components/tutors/ConstellationBackground';

export const dynamic = 'force-dynamic';

function GoldStar({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block text-amber-400/95 drop-shadow-[0_0_6px_rgba(251,191,36,0.45)] ${className}`}
      aria-hidden
    >
      ☆
    </span>
  );
}

export default async function TutorsPage() {
  const supabase = createAdminClient();
  const { data: tutors } = await supabase
    .from('tutors')
    .select('id, full_name, slug, thumbnail_url, hook_intro, specialties, locations, is_verified')
    .eq('is_verified', true)
    .order('full_name');

  const list = tutors ?? [];

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#060b14]">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#070d1a] via-[#060b14] to-[#04070f]" aria-hidden />
      <ConstellationBackground />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-10 lg:pt-20">
        <section className="rounded-3xl border border-amber-500/15 bg-slate-950/55 px-8 py-10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-md sm:px-12 sm:py-14 md:px-14 md:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-400/85">
            My Tutor
          </p>
          <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-slate-100 sm:text-4xl md:text-[2.35rem]">
            Expert Tutors for Authentic, Online, and Face-to-Face Learning (Pakistan, KSA &amp; Gulf).
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300/95 sm:text-lg">
            Our meticulously verified profiles ensure professional scholarship and student success.
          </p>
        </section>

        <section className="mt-14 lg:mt-16">
          <div className="mb-10 flex flex-col gap-2 sm:mb-12">
            <h2 className="text-lg font-semibold text-slate-100 sm:text-xl">Discover your tutor</h2>
            <p className="max-w-2xl text-sm text-slate-400">
              Each listing is reviewed for credentials and teaching quality. Browse profiles and book
              when you are ready.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 xl:gap-10">
            {list.map((tutor) => (
              <Link
                key={tutor.id}
                href={`/tutors/${tutor.slug}`}
                className="group flex flex-col rounded-2xl border border-white/[0.06] bg-slate-950/40 p-6 shadow-sm transition hover:border-amber-500/25 hover:bg-slate-950/70 sm:p-8"
              >
                <div className="flex gap-5">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-900 ring-1 ring-white/5">
                    {tutor.thumbnail_url ? (
                      <Image
                        src={tutor.thumbnail_url}
                        alt={tutor.full_name}
                        fill
                        className="object-cover transition group-hover:scale-[1.02]"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                        Photo soon
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="truncate text-lg font-semibold text-slate-100">{tutor.full_name}</h3>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      {tutor.is_verified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-amber-400/90">
                          <GoldStar className="text-sm" /> Verified
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-amber-400/75">
                        <GoldStar className="text-sm opacity-90" /> Top Rated
                      </span>
                    </div>
                  </div>
                </div>
                {tutor.hook_intro && (
                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-400">{tutor.hook_intro}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(tutor.specialties ?? []).slice(0, 4).map((s: string) => (
                    <span
                      key={s}
                      className="rounded-full border border-amber-500/15 bg-amber-500/[0.07] px-2.5 py-1 text-[11px] text-amber-200/90"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
                  <span>{(tutor.locations ?? []).join(', ') || 'Online & flexible'}</span>
                </div>
              </Link>
            ))}
          </div>

          {list.length === 0 && (
            <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-amber-500/15 bg-slate-950/50 px-8 py-12 text-center backdrop-blur-sm sm:px-10">
              <div className="mx-auto mb-4 flex justify-center gap-1 text-amber-400/90" aria-hidden>
                <GoldStar className="text-xl" />
                <GoldStar className="text-xl" />
              </div>
              <p className="text-base leading-relaxed text-slate-200">
                We are meticulously preparing our top-tier tutor profiles. Check back soon to discover
                your perfect academic match.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
