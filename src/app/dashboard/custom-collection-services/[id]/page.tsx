'use client';

import { useParams } from 'next/navigation';
import { CustomCollectionServiceDetail } from '@/components/custom-collection/CustomCollectionServiceDetail';

export default function CustomCollectionServicePage() {
  const params = useParams();
  return <CustomCollectionServiceDetail serviceId={params.id as string} />;
}
