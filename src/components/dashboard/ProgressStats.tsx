'use client';

import { motion } from 'framer-motion';

interface ProgressStatsProps {
  completed: number;
  total: number;
}

export default function ProgressStats({ completed, total }: ProgressStatsProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // SVG Pie Chart calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="rounded-2xl p-6 border transition-all hover:shadow-md" 
         style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
            Course Progress
          </h3>
          <div className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {percentage}% <span className="text-sm font-medium opacity-60">Complete</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {completed} of {total} total resources completed for your selected level.
          </p>
          
          <div className="mt-4 w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: 'var(--cta-orange)' }}
            />
          </div>
        </div>

        {/* Pie Chart SVG */}
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="var(--bg-surface)"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="var(--cta-orange)"
              strokeWidth="8"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {completed}/{total}
          </div>
        </div>
      </div>
    </div>
  );
}
