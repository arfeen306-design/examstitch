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
        className="w-full h-32 p-3 font-mono text-sm border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500/50"
        placeholder="Paste JSON array here..."
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
      />

      <div className="flex gap-2">
        <button
          onClick={handleParse}
          className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-surface)] rounded-lg hover:bg-[var(--bg-elevated)]"
        >
          Preview JSON
        </button>

        {parsedData.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-green-600 rounded-lg hover:bg-green-500 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isPending ? 'Committing...' : `Commit to Production (${jsonInput.length ? JSON.parse(jsonInput).length : 0} items)`}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {parsedData.length > 0 && (
        <div className="mt-4 overflow-x-auto border border-[var(--border-subtle)] rounded-lg max-h-64">
          <table className="w-full text-sm text-left align-middle">
            <thead className="text-xs uppercase bg-[var(--bg-surface)] text-[var(--text-muted)] sticky top-0">
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
