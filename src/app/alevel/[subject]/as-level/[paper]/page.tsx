'use client';

import ResourceTypeSelector from '@/components/ResourceTypeSelector';
import { getSubjectLabel } from '@/config/navigation';

function formatPaperName(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function ASPaperPage({ params }: { params: { subject: string; paper: string } }) {
  const paperName = formatPaperName(params.paper);

  return (
    <ResourceTypeSelector
      basePath={`/alevel/${params.subject}/as-level/${params.paper}`}
      breadcrumbs={[
        { label: 'A-Level', href: '/alevel' },
        { label: getSubjectLabel(params.subject), href: `/alevel/${params.subject}` },
        { label: 'AS Level', href: `/alevel/${params.subject}/as-level` },
        { label: paperName },
      ]}
      title={paperName}
    />
  );
}
