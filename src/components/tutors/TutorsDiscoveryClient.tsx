'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export type TutorListItem = {
  id: string;
  full_name: string;
  slug: string;
  thumbnail_url: string | null;
  hook_intro: string | null;
  specialties: string[] | null;
  locations: string[] | null;
  is_verified: boolean;
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.08 + i * 0.11, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const staggerParent = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
};

/** Same pattern as Digital Skills hub — animated SVG particles (gold / warm). */
function TutorsParticleField() {
  const reduceMotion = useReducedMotion();
  const particles = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1.5 + Math.random() * 3.5,
        dur: 14 + Math.random() * 16,
        delay: Math.random() * -18,
        opacity: 0.12 + Math.random() * 0.22,
        warm: Math.random() > 0.45,
      })),
    [],
  );

  return (
    <svg className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden>
      {particles.map((p) => (
        <motion.circle
          key={p.id}
          cx={`${p.x}%`}
          cy={`${p.y}%`}
          r={p.size}
          fill={p.warm ? 'rgba(251, 191, 36, 0.85)' : 'rgba(248, 250, 252, 0.5)'}
          opacity={p.opacity}
          animate={
            reduceMotion
              ? undefined
              : {
                  cy: [`${p.y}%`, `${(p.y + 28) % 100}%`, `${p.y}%`],
                  cx: [`${p.x}%`, `${(p.x + 12) % 100}%`, `${p.x}%`],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: p.dur,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: p.delay,
                }
          }
        />
      ))}
    </svg>
  );
}

/** Orbit rings like Digital Skills hero — amber-tinted for My Tutor. */
function TutorsOrbitRings() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {[260, 380, 500].map((size, i) => (
        <motion.div
          key={size}
          className="absolute rounded-full border border-amber-400/[0.07]"
          style={{ width: size, height: size }}
          animate={reduceMotion ? undefined : { rotate: i % 2 === 0 ? 360 : -360 }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 48 + i * 18, repeat: Infinity, ease: 'linear' }
          }
        >
          <motion.div
            className="absolute h-2 w-2 rounded-full bg-amber-400/35"
            style={{ top: 0, left: '50%', marginLeft: -4, marginTop: -4 }}
            animate={reduceMotion ? undefined : { scale: [1, 1.45, 1], opacity: [0.25, 0.55, 0.25] }}
            transition={
              reduceMotion
                ? undefined
                : { duration: 3.2, repeat: Infinity, delay: i * 0.75 }
            }
          />
        </motion.div>
      ))}
    </div>
  );
}

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

export default function TutorsDiscoveryClient({ tutors }: { tutors: TutorListItem[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#060b14]">
      {/* ═══ Full-bleed hero (Digital Skills–style canvas + orbits) ═══ */}
      <section className="relative flex min-h-[min(88vh,920px)] flex-col overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#0c1020] to-[#070a12]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(251,191,36,0.12),transparent_55%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,rgba(59,130,246,0.08),transparent_50%)]"
          aria-hidden
        />
        <TutorsParticleField />
        <TutorsOrbitRings />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 pb-16 pt-20 sm:px-6 lg:px-10 lg:pb-20 lg:pt-24">
          <motion.div
            variants={staggerParent}
            initial="hidden"
            animate="visible"
            className="mx-auto w-full max-w-4xl rounded-3xl border border-amber-500/20 bg-slate-950/50 px-8 py-10 shadow-[0_0_80px_rgba(251,191,36,0.06)] backdrop-blur-xl sm:px-12 sm:py-14 md:px-14 md:py-16"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-400/90"
            >
              My Tutor
            </motion.p>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="mt-4 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-slate-100 sm:text-4xl md:text-[2.35rem]"
            >
              <motion.span
                className="inline-block bg-gradient-to-r from-slate-50 via-slate-100 to-slate-300/90 bg-clip-text text-transparent"
                animate={reduceMotion ? undefined : { opacity: [1, 0.92, 1] }}
                transition={
                  reduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }
                }
              >
                Expert Tutors for Authentic, Online, and Face-to-Face Learning (Pakistan, KSA &amp; Gulf).
              </motion.span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300/95 sm:text-lg"
            >
              Our meticulously verified profiles ensure professional scholarship and student success.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-10">
        <motion.section
          variants={staggerParent}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 xl:gap-10 lg:mt-8"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="col-span-full mb-2 flex flex-col gap-2 sm:mb-4"
          >
            <h2 className="text-lg font-semibold text-slate-100 sm:text-xl">Discover your tutor</h2>
            <p className="max-w-2xl text-sm text-slate-400">
              Each listing is reviewed for credentials and teaching quality. Browse profiles and book when you are
              ready.
            </p>
          </motion.div>

            {tutors.map((tutor, index) => (
              <motion.div
                key={tutor.id}
                variants={fadeUp}
                custom={index + 1}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              >
                <Link
                  href={`/tutors/${tutor.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-white/[0.06] bg-slate-950/50 p-6 shadow-sm transition hover:border-amber-500/30 hover:bg-slate-950/75 sm:p-8"
                >
                  <div className="flex gap-5">
                    <motion.div
                      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-900 ring-1 ring-white/5"
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      {tutor.thumbnail_url ? (
                        <Image
                          src={tutor.thumbnail_url}
                          alt={tutor.full_name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                          Photo soon
                        </div>
                      )}
                    </motion.div>
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
              </motion.div>
            ))}

          {tutors.length === 0 && (
            <motion.div
              variants={fadeUp}
              custom={1}
              className="col-span-full mx-auto mt-2 max-w-xl rounded-2xl border border-amber-500/15 bg-slate-950/50 px-8 py-12 text-center backdrop-blur-sm sm:px-10"
            >
              <div className="mx-auto mb-4 flex justify-center gap-1 text-amber-400/90" aria-hidden>
                <GoldStar className="text-xl" />
                <GoldStar className="text-xl" />
              </div>
              <p className="text-base leading-relaxed text-slate-200">
                We are meticulously preparing our top-tier tutor profiles. Check back soon to discover your perfect
                academic match.
              </p>
            </motion.div>
          )}
        </motion.section>
      </main>
    </div>
  );
}
