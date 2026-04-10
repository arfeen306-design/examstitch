import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, MapPin, Star } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function TutorsPage() {
  const supabase = createAdminClient();
  const { data: tutors } = await supabase
    .from('tutors')
    .select('id, full_name, slug, thumbnail_url, hook_intro, specialties, locations, is_verified')
    .eq('is_verified', true)
    .order('full_name');

  const list = tutors ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-2xl border border-amber-500/40 bg-slate-900 p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-300 font-semibold">My Tutor</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold text-slate-50">Authentic, verified, well trained tutors (Online/F2F in Pakistan &amp; Gulf).</h1>
        <p className="mt-3 text-sm text-slate-200">Professional Scholar collection with high-contrast text and verified profiles.</p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {list.map((tutor) => (
          <Link
            key={tutor.id}
            href={`/tutors/${tutor.slug}`}
            className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 hover:border-amber-400/60 transition"
          >
            <div className="flex gap-4">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                {tutor.thumbnail_url ? (
                  <Image src={tutor.thumbnail_url} alt={tutor.full_name} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No Photo</div>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">{tutor.full_name}</h2>
                {tutor.hook_intro && <p className="text-sm text-[var(--text-secondary)] mt-1">{tutor.hook_intro}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(tutor.specialties ?? []).slice(0, 3).map((s: string) => (
                    <span key={s} className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-300">{s}</span>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {(tutor.locations ?? []).join(', ') || 'Online'}</span>
                  {tutor.is_verified && <span className="inline-flex items-center gap-1 text-emerald-300"><CheckCircle2 className="w-3 h-3" /> Verified</span>}
                </div>
              </div>
            </div>
          </Link>
        ))}
        {list.length === 0 && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center text-[var(--text-muted)]">
            <Star className="w-5 h-5 mx-auto mb-2 text-amber-300" />
            Tutor profiles are being prepared. Check back soon.
          </div>
        )}
      </section>
    </main>
  );
}
