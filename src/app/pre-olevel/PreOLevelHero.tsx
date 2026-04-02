'use client';

import { motion } from 'framer-motion';
import { BookOpen, Clock } from 'lucide-react';
import NotifyMeBox from '@/components/lead-gen/NotifyMeBox';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.1 } }),
};

export default function PreOLevelHero() {
  return (
    <>
      <div className="gradient-hero py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: "var(--accent)" }}>
              <BookOpen className="w-4 h-4" />
              <span>Pre O-Level</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Pre O-Level Resources
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-white/60 max-w-xl">
              Foundation-level mathematics to prepare for IGCSE.
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-12 text-center shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--accent)' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Coming Soon</h2>
          <p className="max-w-md mx-auto mb-8" style={{ color: 'var(--text-muted)' }}>
            Pre O-Level resources are being prepared. Get notified when they are available.
          </p>
          <div className="max-w-md mx-auto">
            <NotifyMeBox level="pre-olevel" sourcePage="/pre-olevel" />
          </div>
        </motion.div>
      </div>
    </>
  );
}
