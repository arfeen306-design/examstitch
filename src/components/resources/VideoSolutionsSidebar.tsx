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
    <div className="bg-white border border-navy-100 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 bg-navy-900 text-white"
      >
        <div className="flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-gold-500" />
          <span className="text-sm font-semibold">Video Solutions</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">{solutions.length} questions</span>
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </button>

      {/* Question List */}
      {!isCollapsed && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          className="divide-y divide-navy-50"
        >
          {sortedSolutions.map((solution) => {
            const qNum = getQuestionNumber(solution);
            const ts   = getTimestamp(solution);

            return (
              <button
                key={solution.id}
                onClick={() => onTimestampClick(ts)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gold-50 ${
                  activeQuestion === qNum ? 'bg-gold-50 border-l-2 border-gold-500' : ''
                }`}
              >
                <div className="shrink-0 w-8 h-8 bg-navy-50 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-navy-600">Q{qNum}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-900 truncate">{solution.label}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 text-xs text-navy-400">
                  <PlayCircle className="w-3.5 h-3.5 text-gold-500" />
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
