'use client';

import ResourceTypeSelector from '@/components/ResourceTypeSelector';
import { getSubjectLabel } from '@/config/navigation';

function formatGrade(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function GradePage({ params }: { params: { subject: string; grade: string } }) {
  const gradeName = formatGrade(params.grade);

  return (
    <ResourceTypeSelector
      basePath={`/olevel/${params.subject}/${params.grade}`}
      breadcrumbs={[
        { label: 'O-Level / IGCSE', href: '/olevel' },
        { label: getSubjectLabel(params.subject), href: `/olevel/${params.subject}` },
        { label: gradeName },
      ]}
      title={gradeName}
    />
  );
}
