'use client';

import { useParams } from 'next/navigation';

import { DiscountProposalDetail } from '@/components/discount-proposals';

export default function DiscountProposalDetailPage() {
  const params = useParams();
  return <DiscountProposalDetail discountProposalId={params.id as string} />;
}
