'use client';

import { useState, useTransition, useRef, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import { CONTENT_TYPES, MODULE_TYPES } from '@/lib/constants';

interface ParsedRow {
  rowNum: number;
  title: string;
  source_url: string;
  content_type: string;
  module_type: string;
  category_slug: string;
  sort_order: number;
  errors: string[];
}

interface BulkResourceUploaderProps {
  subjectId: string;
  categories: { slug: string; name: string }[];
  accentColor: string;
  onUpload: (rows: ValidRow[]) => Promise<{ inserted: number; errors: { row: number; message: string }[] }>;
}

export interface ValidRow {
  title: string;
  source_url: string;
  content_type: string;
  module_type: string;
  category_slug: string;
  sort_order: number;
}

const VALID_CONTENT_TYPES = new Set<string>([CONTENT_TYPES.VIDEO, CONTENT_TYPES.PDF]);
const VALID_MODULE_TYPES = new Set<string>([MODULE_TYPES.VIDEO_TOPICAL, MODULE_TYPES.SOLVED_PAST_PAPER]);

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current.trim());
        current = '';
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        row.push(current.trim());
        current = '';
        if (row.some(c => c !== '')) rows.push(row);
        row = [];
        if (ch === '\r') i++;
      } else {
        current += ch;
      }
    }
  }
  // Last row
  row.push(current.trim());
  if (row.some(c => c !== '')) rows.push(row);

  return rows;
}

function isValidUrl(s: string): boolean {
  try {
    const url = new URL(s);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function BulkResourceUploader({
  subjectId,
  categories,
  accentColor,
  onUpload,
}: BulkResourceUploaderProps) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [result, setResult] = useState<{ inserted: number; errors: { row: number; message: string }[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const validSlugs = new Set(categories.map(c => c.slug));

  const processFile = useCallback((file: File) => {
    setResult(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rawRows = parseCSV(text);

      if (rawRows.length < 2) {
        setRows([]);
        return;
      }

      // Skip header row
      const header = rawRows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
      const titleIdx = header.indexOf('title');
      const urlIdx = header.indexOf('source_url');
      const ctIdx = header.indexOf('content_type');
      const mtIdx = header.indexOf('module_type');
      const csIdx = header.indexOf('category_slug');
      const soIdx = header.indexOf('sort_order');

      const parsed: ParsedRow[] = rawRows.slice(1).map((cols, i) => {
        const errors: string[] = [];
        const title = cols[titleIdx] ?? '';
        const source_url = cols[urlIdx] ?? '';
        const content_type = cols[ctIdx] ?? '';
        const module_type = cols[mtIdx] ?? '';
        const category_slug = cols[csIdx] ?? '';
        const sort_order = parseInt(cols[soIdx] ?? '0', 10) || 0;

        if (!title) errors.push('Title is required');
        if (!source_url) errors.push('Source URL is required');
        else if (!isValidUrl(source_url)) errors.push('Invalid URL');
        if (!VALID_CONTENT_TYPES.has(content_type)) errors.push(`content_type must be "video" or "pdf"`);
        if (!VALID_MODULE_TYPES.has(module_type)) errors.push(`module_type must be "video_topical" or "solved_past_paper"`);
        if (!category_slug) errors.push('category_slug is required');
        else if (!validSlugs.has(category_slug)) errors.push(`Unknown category_slug "${category_slug}"`);

        return { rowNum: i + 2, title, source_url, content_type, module_type, category_slug, sort_order, errors };
      });

      setRows(parsed);
    };
    reader.readAsText(file);
  }, [validSlugs]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) processFile(file);
  };

  const errorCount = rows.filter(r => r.errors.length > 0).length;
  const validRows = rows.filter(r => r.errors.length === 0);

  const handleUpload = async () => {
    if (validRows.length === 0) return;
    setUploading(true);
    setUploadProgress(`Uploading ${validRows.length} resources...`);
    try {
      const res = await onUpload(
        validRows.map(r => ({
          title: r.title,
          source_url: r.source_url,
          content_type: r.content_type,
          module_type: r.module_type,
          category_slug: r.category_slug,
          sort_order: r.sort_order,
        }))
      );
      setResult(res);
      setUploadProgress(null);
      if (res.inserted > 0 && res.errors.length === 0) {
        setRows([]);
        setFileName(null);
      }
    } catch {
      setResult({ inserted: 0, errors: [{ row: 0, message: 'Upload failed unexpectedly' }] });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          dragOver ? 'border-opacity-100 bg-opacity-10' : 'border-opacity-40 hover:border-opacity-70'
        }`}
        style={{
          borderColor: accentColor,
          backgroundColor: dragOver ? `${accentColor}10` : 'transparent',
        }}
      >
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        <Upload className="w-10 h-10 mx-auto mb-3 opacity-50" style={{ color: accentColor }} />
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {fileName ? fileName : 'Drop a CSV file here or click to browse'}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Columns: title, source_url, content_type, module_type, category_slug, sort_order
        </p>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`rounded-xl p-4 flex items-start gap-3 ${
          result.errors.length === 0
            ? 'bg-emerald-500/10 border border-emerald-500/20'
            : 'bg-red-500/10 border border-red-500/20'
        }`}>
          {result.errors.length === 0 ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {result.inserted} resource{result.inserted !== 1 ? 's' : ''} uploaded
              {result.errors.length > 0 && `, ${result.errors.length} failed`}
            </p>
            {result.errors.map((e, i) => (
              <p key={i} className="text-xs text-red-400 mt-1">
                Row {e.row}: {e.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Preview table */}
      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[var(--text-muted)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {rows.length} rows parsed
              </span>
              {errorCount > 0 && (
                <span className="text-xs font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                  {errorCount} with errors
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setRows([]); setFileName(null); setResult(null); }}
                className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
              >
                Clear
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || validRows.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition"
                style={{ backgroundColor: accentColor }}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {uploadProgress}
                  </>
                ) : (
                  `Upload ${validRows.length} Resource${validRows.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] max-h-[400px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--bg-surface)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Module</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {rows.map(r => (
                  <tr key={r.rowNum} className={r.errors.length > 0 ? 'bg-red-500/5' : ''}>
                    <td className="px-3 py-2 text-[var(--text-muted)]">{r.rowNum}</td>
                    <td className="px-3 py-2 text-[var(--text-primary)] max-w-[200px] truncate">{r.title || '—'}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{r.content_type || '—'}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{r.module_type || '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs text-[var(--text-muted)]">{r.category_slug || '—'}</td>
                    <td className="px-3 py-2">
                      {r.errors.length === 0 ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <div className="flex items-start gap-1">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            {r.errors.map((e, i) => (
                              <p key={i} className="text-xs text-red-400">{e}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
