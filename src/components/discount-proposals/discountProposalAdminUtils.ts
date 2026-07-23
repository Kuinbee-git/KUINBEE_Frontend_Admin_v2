import type {
  DatasetDiscountProposal,
  DiscountProposalStatus,
  DiscountTargetSurface,
} from '@/types/discount.types';

const currencySymbol = (currency: string) => {
  if (currency === 'USD') return '$';
  if (currency === 'EUR') return '€';
  if (currency === 'GBP') return '£';
  return '₹';
};

export const formatMoney = (amount: string | number, currency: string) => {
  const numeric = Number(amount);
  const display = Number.isFinite(numeric)
    ? numeric.toLocaleString('en-IN', { maximumFractionDigits: 2 })
    : String(amount);

  return `${currencySymbol(currency)}${display} ${currency}`;
};

export const surfaceLabel = (surface: DiscountTargetSurface) =>
  surface === 'DATASET_PRICING' ? 'Checkout price' : 'Sample commercial price';

export const discountStatusSemantic = (status: DiscountProposalStatus) => {
  if (status === 'APPROVED' || status === 'ACTIVE') return 'success' as const;
  if (status === 'UNDER_REVIEW') return 'in_progress' as const;
  if (status === 'SUBMITTED') return 'pending' as const;
  if (status === 'REJECTED') return 'error' as const;
  return 'neutral' as const;
};

export const formatDateTime = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export const formatDiscount = (proposal: DatasetDiscountProposal) =>
  proposal.discountType === 'PERCENTAGE'
    ? `${proposal.discountValue}%`
    : formatMoney(proposal.discountValue, proposal.currencySnapshot);
