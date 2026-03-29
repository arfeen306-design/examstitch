'use client';

import { useState } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';

export default function SubscriberCopyButton({ emails }: { emails: string[] }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!emails.length) return;
    try {
      await navigator.clipboard.writeText(emails.join(', '));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      disabled={emails.length === 0}
      className="flex flex-none items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-navy-900 border border-navy-700 rounded-lg shadow-sm hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
    >
      {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      {copied ? 'Copied to Clipboard!' : 'Copy All Emails'}
    </button>
  );
}
