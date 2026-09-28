'use client';

import { useParams } from 'next/navigation';
import { ClaruSubmissionDetail } from '@/components/claru/ClaruSubmissionDetail';

export default function ClaruSubmissionPage() {
  const params = useParams();
  return <ClaruSubmissionDetail submissionId={params.submissionId as string} />;
}
