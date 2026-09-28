'use client';

import { useParams } from 'next/navigation';
import { ClaruBatchWorkspace } from '@/components/claru/ClaruBatchWorkspace';

export default function ClaruBatchPage() {
  const params = useParams();
  return <ClaruBatchWorkspace batchId={params.batchId as string} />;
}
