'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import SubjectCard from '@/components/SubjectCard';
import { A_LEVEL_SUBJECTS } from '@/config/subjects';
import { useSubjectCounts } from '@/lib/useSubjectCounts';

export default function ALevelPage() {
  const [toast, setToast] = useState<string | null>(null);

  const activeSlugs = useMemo(() => A_LEVEL_SUBJECTS.filter(s => s.active).map(s => s.id), []);
  const counts = useSubjectCounts(activeSlugs);

  const showComingSoon = () => {
    setToast('This subject is coming soon — stay tuned!');
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0B1120]">
      {/* ─── Toast ─── */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-5 py-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/[0.15] text-white text-sm font-medium shadow-2xl">
            {toast}
          </div>
        </div>
      )}

      {/* ─── Hero ─── */}
      <div className="gradient-hero pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 text-gold-500 text-sm font-medium mb-3">
              <Award className="w-4 h-4" />
              <span>A-Level</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              A-Level Resources
            </h1>
            <p className="text-white/60 max-w-xl">
              Cambridge A-Level past papers, video lectures, and topical worksheets — AS and A2 Level.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ─── Subject Grid ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-20">
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {A_LEVEL_SUBJECTS.map((subject, i) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              index={i}
              basePath="/alevel"
              resourceCount={subject.active ? counts[subject.id] : undefined}
              onComingSoon={showComingSoon}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
