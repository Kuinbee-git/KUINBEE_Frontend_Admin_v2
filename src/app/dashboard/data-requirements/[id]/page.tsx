'use client';

import { useParams } from 'next/navigation';
import { DataRequirementDetail } from '@/components/data-requirements/DataRequirementDetail';

export default function DataRequirementPage() {
  const params = useParams();
  return <DataRequirementDetail key={params.id as string} requirementId={params.id as string} />;
}
