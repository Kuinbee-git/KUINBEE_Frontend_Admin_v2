import type { Currency, DatasetStatus } from './dataset.types';

export type DiscountTargetSurface = 'DATASET_PRICING' | 'SAMPLE_ACTUAL_PRICE';
type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type DiscountProposalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CANCELLED';

interface DatasetPricingDto {
  id: string;
  datasetId: string;
  status: string;
  isPaid: boolean;
  price: string | null;
  currency: Currency;
  notes: string | null;
  changeRationale: string | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  updatedAt: string;
}

export interface DatasetDiscountProposal {
  id: string;
  datasetId: string;
  pricingVersionId: string | null;
  targetSurface: DiscountTargetSurface;
  status: DiscountProposalStatus;
  basePriceSnapshot: string;
  currencySnapshot: Currency;
  discountType: DiscountType;
  discountValue: string;
  finalPriceSnapshot: number;
  startsAt: string;
  endsAt: string;
  supplierNotes: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  createdById: string;
  reviewedById: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminDiscountProposalDataset {
  id: string;
  datasetUniqueId: string;
  title: string;
  status: DatasetStatus;
  isSample: boolean;
  actualPrice: number | null;
  actualPriceCurrency?: string | null;
  activePricing?: DatasetPricingDto | null;
}

export interface AdminDiscountProposalListItem {
  discountProposal: DatasetDiscountProposal;
  dataset: AdminDiscountProposalDataset;
  supplier?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  reviewer?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export interface DiscountProposalListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: DiscountProposalStatus;
  targetSurface?: DiscountTargetSurface;
  datasetId?: string;
  sort?:
    | 'createdAt:desc'
    | 'createdAt:asc'
    | 'startsAt:asc'
    | 'startsAt:desc'
    | 'endsAt:asc'
    | 'endsAt:desc';
}

export interface DiscountProposalApproveBody {
  adminNotes?: string;
}

export interface DiscountProposalRejectBody {
  rejectionReason: string;
  adminNotes?: string;
}

export interface DiscountProposalMutationResponse {
  discountProposal: DatasetDiscountProposal;
}
