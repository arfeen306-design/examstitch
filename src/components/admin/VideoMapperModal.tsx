/**
 * REUSABLE VIDEO MAPPER — Question Timestamp Editor
 *
 * Maps exam questions and sub-parts to specific video timestamps.
 * Stores data in the `question_mapping` JSONB column on resources.
 *
 * To add video mapping to any new subject admin panel:
 * 1. Import VideoMapperModal from '@/components/admin/VideoMapperModal'
 * 2. Import { updateResourceTimestamps } from '@/app/admin/shared/actions'
 * 3. Add a Clock button to your resource table row that sets mappingResourceId
 * 4. Render <VideoMapperModal resourceId={id} ... onSave={updateResourceTimestamps} />
 * No other changes needed — works for CS, Maths, Physics, or any subject.
 */

'use client';

import { useState, useTransition } from 'react';
import { Clock, Check, X, Trash2, Plus } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface QuestionPart {
  part: string;
  start_time: number;
  pdf_page: number;
}

interface QuestionMapping {
  question: number;
  label: string;
  start_time: number;
  parts: QuestionPart[];
}

interface VideoMapperModalProps {
  /** Resource UUID */
  resourceId: string;
  /** Resource title (shown in header) */
  resourceTitle: string;
  /** Existing question_mapping from the resource (null if none) */
  currentMapping: QuestionMapping[] | null;
  /** Called with (resourceId, mapping) — should call server action and return result */
  onSave: (resourceId: string, mapping: QuestionMapping[] | null) => Promise<{ success: boolean; error?: string }>;
  /** Called when the editor is closed */
  onClose: () => void;
  /** Optional accent color for buttons */
  accentColor?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function secondsToMmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function mmssToSeconds(value: string): number {
  const [mm, ss] = value.split(':').map(Number);
  return (mm || 0) * 60 + (ss || 0);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function VideoMapperModal({
  resourceId,
  resourceTitle,
  currentMapping,
  onSave,
  onClose,
  accentColor = '#a855f7',
}: VideoMapperModalProps) {
  const [draft, setDraft] = useState<QuestionMapping[]>(
    currentMapping && currentMapping.length > 0
      ? currentMapping
      : [{ question: 1, label: 'Q1', start_time: 0, parts: [] }],
  );
  const [isPending, startTransition] = useTransition();

  // ── Mutations ────────────────────────────────────────────────────────────

  function addQuestion() {
    const next = draft.length + 1;
    setDraft([...draft, { question: next, label: `Q${next}`, start_time: 0, parts: [] }]);
  }

  function removeQuestion(index: number) {
    setDraft(draft.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, updates: Partial<QuestionMapping>) {
    setDraft(draft.map((q, i) => (i === index ? { ...q, ...updates } : q)));
  }

  function addPart(qi: number) {
    const parts = draft[qi].parts || [];
    const nextPart = String.fromCharCode(97 + parts.length);
    updateQuestion(qi, { parts: [...parts, { part: nextPart, start_time: draft[qi].start_time, pdf_page: 1 }] });
  }

  function updatePart(qi: number, pi: number, updates: Partial<QuestionPart>) {
    const copy = [...draft];
    const parts = [...copy[qi].parts];
    parts[pi] = { ...parts[pi], ...updates };
    copy[qi] = { ...copy[qi], parts };
    setDraft(copy);
  }

  function removePart(qi: number, pi: number) {
    const copy = [...draft];
    copy[qi] = { ...copy[qi], parts: copy[qi].parts.filter((_, i) => i !== pi) };
    setDraft(copy);
  }

  function handleSave() {
    startTransition(async () => {
      const clean = draft.filter(q => q.label);
      await onSave(resourceId, clean.length > 0 ? clean : null);
      onClose();
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <tr className="bg-purple-500/10 border-l-4 border-purple-500/40">
      <td colSpan={99} className="px-4 py-3">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Question Timestamps — {resourceTitle}
            </span>
            <button
              onClick={addQuestion}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 px-2 py-1 rounded border border-purple-500/30 hover:bg-purple-500/15 transition"
            >
              + Add Question
            </button>
          </div>

          {/* Questions */}
          {draft.map((q, qi) => (
            <div key={qi} className="flex flex-col gap-2 p-2 bg-[var(--bg-card)] rounded-lg border border-purple-500/20">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Label */}
                <input
                  value={q.label}
                  onChange={e => updateQuestion(qi, { label: e.target.value })}
                  className="w-16 px-2 py-1 text-xs font-bold border border-purple-500/30 rounded-md text-center bg-[var(--bg-card)] text-[var(--text-primary)]"
                  placeholder="Q1"
                />
                <span className="text-xs text-[var(--text-muted)]">@</span>
                {/* Timestamp */}
                <input
                  type="text"
                  value={secondsToMmss(q.start_time)}
                  onChange={e => updateQuestion(qi, { start_time: mmssToSeconds(e.target.value) })}
                  className="w-16 px-2 py-1 text-xs font-mono border border-purple-500/30 rounded-md text-center bg-[var(--bg-card)] text-[var(--text-primary)]"
                  placeholder="0:00"
                  title="MM:SS"
                />
                {/* + Part */}
                <button
                  onClick={() => addPart(qi)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold px-1.5 py-0.5 rounded border border-blue-500/30 hover:bg-blue-500/10 transition"
                >
                  + Part
                </button>
                {/* Remove question */}
                <button
                  onClick={() => removeQuestion(qi)}
                  className="text-red-400 hover:text-red-600 p-0.5 rounded hover:bg-red-500/10 transition ml-auto"
                  title="Remove"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* Sub-parts */}
              {q.parts && q.parts.length > 0 && (
                <div className="flex flex-wrap gap-2 pl-6">
                  {q.parts.map((part, pi) => (
                    <div key={pi} className="flex items-center gap-1 bg-blue-500/15 rounded px-2 py-1">
                      <span className="text-xs font-bold text-blue-300 w-4">{part.part.toUpperCase()}</span>
                      <input
                        type="text"
                        value={secondsToMmss(part.start_time)}
                        onChange={e => updatePart(qi, pi, { start_time: mmssToSeconds(e.target.value) })}
                        className="w-14 px-1 py-0.5 text-[10px] font-mono border border-blue-500/30 rounded text-center bg-[var(--bg-card)] text-[var(--text-primary)]"
                        title="MM:SS"
                      />
                      <input
                        type="number"
                        min="1"
                        value={part.pdf_page || ''}
                        onChange={e => updatePart(qi, pi, { pdf_page: parseInt(e.target.value) || 1 })}
                        className="w-10 px-1 py-0.5 text-[10px] border border-blue-500/30 rounded text-center bg-[var(--bg-card)] text-[var(--text-primary)]"
                        placeholder="pg"
                        title="PDF page"
                      />
                      <button
                        onClick={() => removePart(qi, pi)}
                        className="text-red-400 hover:text-red-600 p-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" /> {isPending ? 'Saving…' : 'Save Timestamps'}
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-color)] transition"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export type { QuestionMapping, QuestionPart, VideoMapperModalProps };
