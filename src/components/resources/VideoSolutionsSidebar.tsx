'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, ChevronDown, ChevronUp } from 'lucide-react';

// Accept either snake_case (from Supabase) or camelCase (from demo data).
// Both shapes are valid — accessors below normalise them.
export interface SolutionRow {
  id: string;
  label: string;
  question_number?: number;
  questionNumber?: number;
  timestamp_seconds?: number;
  timestampSeconds?: number;
  sort_order?: number;
  sortOrder?: number;
}

interface VideoSolutionsSidebarProps {
  solutions: SolutionRow[];
  videoId: string;
  videoTitle: string;
  onTimestampClick: (seconds: number) => void;
  activeQuestion?: number;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Normalise either naming convention
function getQuestionNumber(s: SolutionRow): number {
  return s.question_number ?? s.questionNumber ?? 0;
}
function getTimestamp(s: SolutionRow): number {
  return s.timestamp_seconds ?? s.timestampSeconds ?? 0;
}
function getSortOrder(s: SolutionRow): number {
  return s.sort_order ?? s.sortOrder ?? 0;
}

export default function VideoSolutionsSidebar({
  solutions,
  videoId,
  videoTitle,
  onTimestampClick,
  activeQuestion,
}: VideoSolutionsSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sortedSolutions = [...solutions].sort(
    (a, b) => getSortOrder(a) - getSortOrder(b),
  );

  return (
    <div className="rounded-2xl overflow-hidden"
         style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-5 py-4"
        style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--text-on-dark)' }}
      >
        <div className="flex items-center gap-3">
          <PlayCircle className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          <span className="text-sm font-semibold">Video Solutions</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-50">{solutions.length} questions</span>
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </button>

      {/* Question List — increased padding and gap for breathability */}
      {!isCollapsed && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          transition={{ type: 'spring', stiffness: 400, damping: 35, mass: 0.8 }}
          className="overflow-hidden"
        >
          {sortedSolutions.map((solution) => {
            const qNum = getQuestionNumber(solution);
            const ts   = getTimestamp(solution);
            const isActive = activeQuestion === qNum;

            return (
              <button
                key={solution.id}
                onClick={() => onTimestampClick(ts)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors duration-150"
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                }}
              >
                <div
                  className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                >
                  <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Q{qNum}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {solution.label}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <PlayCircle className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  {formatTime(ts)}
                </div>
              </button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
