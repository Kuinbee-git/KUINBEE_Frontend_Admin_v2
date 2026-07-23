import { API_ROUTES } from '@/lib/constants/api-routes';
import { apiClient } from '@/lib/api/client';
import type { ApiSuccessResponse, PaginatedResponse } from '@/types';
import type {
  AdminDiscountProposalListItem,
  DiscountProposalApproveBody,
  DiscountProposalListParams,
  DiscountProposalMutationResponse,
  DiscountProposalRejectBody,
} from '@/types/discount.types';

interface DiscountProposalListApiData {
  items: AdminDiscountProposalListItem[];
  page: number;
  pageSize: number;
  total: number;
}

const buildQueryString = (params: DiscountProposalListParams) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export async function getDiscountProposals(
  params: DiscountProposalListParams = {}
): Promise<PaginatedResponse<AdminDiscountProposalListItem>> {
  const response = await apiClient.get<ApiSuccessResponse<DiscountProposalListApiData>>(
    `${API_ROUTES.ADMIN.DISCOUNT_PROPOSALS.LIST}${buildQueryString(params)}`
  );
  const apiData = response.data.data;

  return {
    items: apiData.items,
    pagination: {
      page: apiData.page,
      pageSize: apiData.pageSize,
      total: apiData.total,
      totalPages: Math.ceil(apiData.total / apiData.pageSize),
    },
  };
}

export async function getDiscountProposalReview(
  discountProposalId: string
): Promise<AdminDiscountProposalListItem> {
  const response = await apiClient.get<ApiSuccessResponse<AdminDiscountProposalListItem>>(
    API_ROUTES.ADMIN.DISCOUNT_PROPOSALS.REVIEW(discountProposalId)
  );
  return response.data.data;
}

export async function approveDiscountProposal(
  discountProposalId: string,
  data: DiscountProposalApproveBody = {}
): Promise<DiscountProposalMutationResponse> {
  const response = await apiClient.post<ApiSuccessResponse<DiscountProposalMutationResponse>>(
    API_ROUTES.ADMIN.DISCOUNT_PROPOSALS.APPROVE(discountProposalId),
    data
  );
  return response.data.data;
}

export async function rejectDiscountProposal(
  discountProposalId: string,
  data: DiscountProposalRejectBody
): Promise<DiscountProposalMutationResponse> {
  const response = await apiClient.post<ApiSuccessResponse<DiscountProposalMutationResponse>>(
    API_ROUTES.ADMIN.DISCOUNT_PROPOSALS.REJECT(discountProposalId),
    data
  );
  return response.data.data;
}
