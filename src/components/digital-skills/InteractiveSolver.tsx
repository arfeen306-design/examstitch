'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Trophy,
  Sparkles,
  Brain,
} from 'lucide-react';
import confetti from 'canvas-confetti';

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

interface QuizData {
  id?: string;
  questions: QuizQuestion[];
  difficulty: string;
  question_count: number;
}

interface InteractiveSolverProps {
  lessonId: string;
  lessonTitle: string;
  gradient: string;
  glowColor: string;
  isAdmin?: boolean;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

const OPTION_COLORS = {
  idle: 'bg-white/[0.04] border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.08]',
  selected: 'bg-teal-500/10 border-teal-400/40',
  correct: 'bg-emerald-500/15 border-emerald-400/50',
  wrong: 'bg-red-500/15 border-red-400/50',
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function InteractiveSolver({
  lessonId,
  lessonTitle,
  gradient,
  glowColor,
  isAdmin = false,
}: InteractiveSolverProps) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch or generate quiz
  const fetchQuiz = useCallback(
    async (regenerate = false) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/quiz/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId,
            difficulty: 'medium',
            questionCount: 5,
            regenerate,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to generate quiz');
        setQuiz(data.quiz);
        setCurrentIdx(0);
        setSelectedOption(null);
        setAnswered(false);
        setScore(0);
        setAnsweredCount(0);
        setShowSummary(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    },
    [lessonId],
  );

  const handleStart = useCallback(() => {
    setStarted(true);
    fetchQuiz();
  }, [fetchQuiz]);

  // Fire confetti
  const fireConfetti = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({
      particleCount: 60,
      spread: 55,
      origin: { x, y },
      colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
      disableForReducedMotion: true,
    });
  }, []);

  // Handle option click
  const handleOptionClick = useCallback(
    (optIdx: number) => {
      if (!quiz || answered) return;

      const q = quiz.questions[currentIdx];
      const correctIdx = OPTION_LABELS.indexOf(q.correct_answer);
      const correct = optIdx === correctIdx;

      setSelectedOption(optIdx);
      setAnswered(true);
      setIsCorrect(correct);

      if (correct) {
        setScore((s) => s + 1);
        fireConfetti();
      }
      setAnsweredCount((c) => c + 1);
    },
    [quiz, currentIdx, answered, fireConfetti],
  );

  // Next question
  const handleNext = useCallback(() => {
    if (!quiz) return;
    if (currentIdx + 1 >= quiz.questions.length) {
      setShowSummary(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      setAnswered(false);
      setIsCorrect(false);
    }
  }, [quiz, currentIdx]);

  // Retry wrong answer
  const handleRetry = useCallback(() => {
    setSelectedOption(null);
    setAnswered(false);
    setIsCorrect(false);
  }, []);

  // Reset quiz from scratch
  const handleReset = useCallback(() => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setAnswered(false);
    setIsCorrect(false);
    setScore(0);
    setAnsweredCount(0);
    setShowSummary(false);
  }, []);

  // ── Landing state (not started) ──────────────────────────────
  if (!started) {
    return (
      <div className="space-y-4">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white/50" /> Interactive Solver
        </h3>
        <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-6 text-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
            className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          <p className="text-white/70 text-sm font-medium mb-1">AI-Powered Examiner</p>
          <p className="text-white/40 text-xs max-w-sm mx-auto leading-relaxed mb-4">
            Gemini AI will analyze this lesson and generate personalized MCQs to test your understanding.
          </p>
          <button
            onClick={handleStart}
            className={`px-6 py-2.5 rounded-xl bg-gradient-to-r ${gradient} text-white text-xs font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]`}
          >
            <Zap className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            Generate Quiz
          </button>
        </div>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white/50" /> AI Examiner
        </h3>
        <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-8 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}
          >
            <Loader2 className="w-7 h-7 text-white" />
          </motion.div>
          <p className="text-white/70 text-sm font-medium mb-1">Generating Quiz…</p>
          <p className="text-white/40 text-xs">
            Analyzing transcript & crafting questions
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white/50" /> AI Examiner
        </h3>
        <div className="rounded-xl bg-red-500/[0.06] border border-red-500/20 p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400/70 mx-auto mb-3" />
          <p className="text-red-300/80 text-sm font-medium mb-1">{error}</p>
          <button
            onClick={() => fetchQuiz(true)}
            className="mt-3 px-4 py-2 rounded-lg bg-white/[0.08] text-white/70 text-xs font-semibold hover:bg-white/[0.12] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 inline mr-1.5" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) return null;

  // ── Summary screen ────────────────────────────────────────────
  if (showSummary) {
    const pct = Math.round((score / quiz.questions.length) * 100);
    const emoji = pct === 100 ? '🏆' : pct >= 70 ? '🎉' : pct >= 40 ? '💪' : '📖';

    return (
      <div className="space-y-4" ref={containerRef}>
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" /> Quiz Complete
        </h3>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-6 text-center"
        >
          <div className="text-5xl mb-3">{emoji}</div>
          <p className="text-white text-xl font-bold mb-1">
            {score}/{quiz.questions.length}
          </p>
          <p className="text-white/50 text-sm mb-1">{pct}% Correct</p>
          <p className="text-white/30 text-xs mb-5">{lessonTitle}</p>

          {/* Progress ring */}
          <div className="relative w-24 h-24 mx-auto mb-5">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none"
                stroke={pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={264}
                initial={{ strokeDashoffset: 264 }}
                animate={{ strokeDashoffset: 264 - (264 * pct) / 100 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-lg">{pct}%</span>
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-white/[0.08] text-white/70 text-xs font-semibold hover:bg-white/[0.12] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 inline mr-1" /> Retry
            </button>
            {isAdmin && (
              <button
                onClick={() => fetchQuiz(true)}
                className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 inline mr-1" /> Regenerate
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Active question ───────────────────────────────────────────
  const q = quiz.questions[currentIdx];
  const correctIdx = OPTION_LABELS.indexOf(q.correct_answer);

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Header + Progress */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Brain className="w-4 h-4 text-teal-400" /> AI Examiner
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 font-mono">
            {currentIdx + 1}/{quiz.questions.length}
          </span>
          {isAdmin && (
            <button
              onClick={() => fetchQuiz(true)}
              title="Regenerate quiz (Admin)"
              className="w-6 h-6 rounded-md bg-amber-500/20 flex items-center justify-center hover:bg-amber-500/30 transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-amber-300" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${((currentIdx + (answered ? 1 : 0)) / quiz.questions.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-5">
            <p className="text-white text-sm font-semibold leading-relaxed mb-5">
              {q.question}
            </p>

            {/* Options */}
            <div className="space-y-2.5">
              {q.options.map((opt, i) => {
                let state: keyof typeof OPTION_COLORS = 'idle';
                if (answered && i === correctIdx) state = 'correct';
                else if (answered && i === selectedOption && !isCorrect) state = 'wrong';
                else if (!answered && i === selectedOption) state = 'selected';

                return (
                  <motion.button
                    key={i}
                    onClick={() => handleOptionClick(i)}
                    disabled={answered}
                    animate={
                      state === 'wrong'
                        ? { x: [0, -8, 8, -4, 4, 0] }
                        : {}
                    }
                    transition={{ duration: 0.4 }}
                    className={`w-full text-left px-4 py-3 rounded-xl border backdrop-blur-sm transition-all duration-200 flex items-center gap-3 group
                      ${OPTION_COLORS[state]}
                      ${!answered ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {/* Letter badge */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-all
                        ${state === 'correct'
                          ? 'bg-emerald-500 text-white'
                          : state === 'wrong'
                            ? 'bg-red-500 text-white'
                            : `bg-white/[0.06] text-white/50 ${!answered ? 'group-hover:bg-teal-500/20 group-hover:text-teal-300' : ''}`
                        }`}
                    >
                      {state === 'correct' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : state === 'wrong' ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        OPTION_LABELS[i]
                      )}
                    </div>

                    {/* Option text */}
                    <span
                      className={`text-sm transition-colors flex-1
                        ${state === 'correct'
                          ? 'text-emerald-300 font-semibold'
                          : state === 'wrong'
                            ? 'text-red-300'
                            : 'text-white/70 group-hover:text-white/90'
                        }`}
                    >
                      {opt}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation + Actions (shown after answering) */}
            <AnimatePresence>
              {answered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 overflow-hidden"
                >
                  {/* Explanation */}
                  <div
                    className={`rounded-lg p-3 text-xs leading-relaxed mb-3
                      ${isCorrect
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300/80'
                        : 'bg-red-500/10 border border-red-500/20 text-red-300/80'
                      }`}
                  >
                    <span className="font-bold">
                      {isCorrect ? '✓ Correct! ' : '✗ Incorrect. '}
                    </span>
                    {q.explanation}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {!isCorrect && (
                      <button
                        onClick={handleRetry}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/60 text-xs font-semibold hover:bg-white/[0.1] transition-colors"
                      >
                        <RotateCcw className="w-3 h-3 inline mr-1" /> Try Again
                      </button>
                    )}
                    <button
                      onClick={handleNext}
                      className={`px-4 py-1.5 rounded-lg bg-gradient-to-r ${gradient} text-white text-xs font-bold shadow-md hover:shadow-lg transition-all`}
                    >
                      {currentIdx + 1 >= quiz.questions.length ? 'See Results' : 'Next'}
                      <ChevronRight className="w-3 h-3 inline ml-1" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Score ticker */}
      <div className="flex items-center justify-between text-xs text-white/30">
        <span>Score: <span className="text-teal-400 font-bold">{score}</span>/{answeredCount}</span>
        <span className="font-mono">{quiz.difficulty}</span>
      </div>
    </div>
  );
}
