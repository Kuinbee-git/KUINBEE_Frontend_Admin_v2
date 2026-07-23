'use client';

import { useParams } from 'next/navigation';
import { CustomCollectionLeadDetail } from '@/components/custom-collection/CustomCollectionLeadDetail';

export default function CustomCollectionLeadPage() {
  const params = useParams();
  return <CustomCollectionLeadDetail leadId={params.id as string} />;
}
