'use client';

import { useState, useTransition } from 'react';
import { bulkInsertResources } from '../../actions';

export default function BulkUploadPreview() {
  const [jsonInput, setJsonInput] = useState('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleParse = () => {
    try {
      const data = JSON.parse(jsonInput);
      if (!Array.isArray(data)) throw new Error('Root must be an array of objects.');
      setParsedData(data.slice(0, 50)); // cap preview to 50 rows
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setParsedData([]);
    }
  };

  const handleUpload = () => {
    if (!parsedData.length) return;
    
    startTransition(async () => {
      // Actually upload all data
      try {
        const fullData = JSON.parse(jsonInput);
        const { success, error } = await bulkInsertResources(fullData);
        if (!success) {
          setError(error || 'Failed to bulk insert');
        } else {
          setJsonInput('');
          setParsedData([]);
          alert('Successfully uploaded!');
        }
      } catch (e: any) {
        setError(e.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      <textarea
        className="w-full h-32 p-3 font-mono text-sm rounded-lg bg-slate-900/40 backdrop-blur-md border border-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/35 focus:border-amber-500/40"
        placeholder="Paste JSON array here..."
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleParse}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-amber-500/50 bg-transparent text-amber-400 hover:bg-amber-500/10 hover:shadow-[0_0_12px_rgba(245,158,11,0.12)] transition"
        >
          Preview JSON
        </button>

        {parsedData.length > 0 && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-emerald-500/50 bg-transparent text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50 transition"
          >
            {isPending ? 'Committing...' : `Commit to Production (${jsonInput.length ? JSON.parse(jsonInput).length : 0} items)`}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {parsedData.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-lg max-h-64 border border-slate-700/50 bg-slate-950/30">
          <table className="w-full text-sm text-left align-middle text-slate-200">
            <thead className="text-xs uppercase bg-slate-900/60 text-slate-400 sticky top-0 border-b border-slate-700/50">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Category ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] bg-[var(--bg-card)]">
              {parsedData.map((row, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)] truncate max-w-[200px]">{row.title}</td>
                  <td className="px-4 py-3">{row.subject}</td>
                  <td className="px-4 py-3">{row.topic || '-'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.category_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {JSON.parse(jsonInput).length > 50 && (
            <p className="p-2 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-surface)]">Showing 50 of {JSON.parse(jsonInput).length} rows...</p>
          )}
        </div>
      )}
    </div>
  );
}
