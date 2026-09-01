import { apiClient, type QueryParams } from '@/lib/api/client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import type {
  ApiSuccessResponse,
  DashboardSummary,
  DatasetRatingItem,
  DatasetRatingsSort,
  PaginatedResponse,
} from '@/types';
import { buildQueryString } from '@/lib/utils/service.utils';

interface CompatibilityListResponse {
  items: unknown[];
  page: number;
  pageSize: number;
  total: number;
}

const getStatusCode = (error: unknown) =>
  error && typeof error === 'object' && 'statusCode' in error
    ? Number(error.statusCode)
    : undefined;

async function getCompatibilityTotal(endpoint: string, params: QueryParams): Promise<number> {
  const response = await apiClient.request<ApiSuccessResponse<CompatibilityListResponse>>(
    endpoint,
    {
      method: 'GET',
      params: { page: 1, pageSize: 1, ...params },
    }
  );
  return response.data.data.total;
}

async function nullWhenUnavailable<T>(operation: () => Promise<T>): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    if ([403, 404].includes(getStatusCode(error) ?? 0)) return null;
    throw error;
  }
}

/**
 * Keeps the dashboard useful during a rolling deployment where the optimized
 * summary endpoint is not available yet. Every displayed value still comes
 * from an exact backend `total`; time-window metrics remain hidden because the
 * older APIs cannot calculate them without downloading entire datasets.
 */
async function getCompatibilityDashboardSummary(): Promise<DashboardSummary> {
  const [proposalMetrics, assignedToMe, pendingSupplierKyc] = await Promise.all([
    nullWhenUnavailable(async () => {
      const [submittedUnassigned, resubmittedUnassigned, inReview, changesRequested] =
        await Promise.all([
          getCompatibilityTotal(API_ROUTES.ADMIN.DATASET_PROPOSALS.LIST, {
            verificationStatus: 'SUBMITTED',
            assignedTo: 'UNASSIGNED',
          }),
          getCompatibilityTotal(API_ROUTES.ADMIN.DATASET_PROPOSALS.LIST, {
            verificationStatus: 'RESUBMITTED',
            assignedTo: 'UNASSIGNED',
          }),
          getCompatibilityTotal(API_ROUTES.ADMIN.DATASET_PROPOSALS.LIST, {
            verificationStatus: 'UNDER_REVIEW',
          }),
          getCompatibilityTotal(API_ROUTES.ADMIN.DATASET_PROPOSALS.LIST, {
            verificationStatus: 'CHANGES_REQUESTED',
          }),
        ]);

      return {
        unassignedReviews: submittedUnassigned + resubmittedUnassigned,
        inReview,
        changesRequested,
      };
    }),
    nullWhenUnavailable(() =>
      getCompatibilityTotal(API_ROUTES.ADMIN.ASSIGNED_DATASETS, { status: 'ACTIVE' })
    ),
    nullWhenUnavailable(() =>
      getCompatibilityTotal(API_ROUTES.ADMIN.SUPPLIERS.KYC_QUEUE, { status: 'PENDING' })
    ),
  ]);

  const unassignedReviews = proposalMetrics?.unassignedReviews ?? null;
  const changesRequested = proposalMetrics?.changesRequested ?? null;
  const alerts: DashboardSummary['alerts'] = [];

  if (typeof unassignedReviews === 'number' && unassignedReviews > 0) {
    alerts.push({
      id: 'unassigned-reviews',
      severity: 'warning',
      title: 'Unassigned review queue',
      message: `${unassignedReviews} submitted review${unassignedReviews === 1 ? ' is' : 's are'} waiting for an owner.`,
      href: '/dashboard/proposals?assignment=UNASSIGNED',
    });
  }

  if (typeof changesRequested === 'number' && changesRequested > 0) {
    alerts.push({
      id: 'changes-requested',
      severity: 'info',
      title: 'Supplier changes outstanding',
      message: `${changesRequested} proposal${changesRequested === 1 ? ' is' : 's are'} waiting on requested changes.`,
      href: '/dashboard/proposals?verification=CHANGES_REQUESTED',
    });
  }
  if (typeof pendingSupplierKyc === 'number' && pendingSupplierKyc > 0) {
    alerts.push({
      id: 'pending-supplier-kyc',
      severity: 'warning',
      title: 'Supplier verification queue',
      message: `${pendingSupplierKyc} supplier KYC submission${pendingSupplierKyc === 1 ? ' is' : 's are'} awaiting a decision.`,
      href: '/dashboard/supplier-kyc',
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    signals: {
      unassignedReviews,
      inReview: proposalMetrics?.inReview ?? null,
      changesRequested,
      pendingSupplierKyc,
      publishedLastSevenDays: null,
      unresolvedOverFortyEightHours: null,
    },
    workload: {
      assignedToMe,
      completedTodayUtc: null,
    },
    alerts,
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const compatibilityOnly = process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_COMPAT_MODE === 'true';
  if (compatibilityOnly) return getCompatibilityDashboardSummary();

  try {
    const response = await apiClient.request<ApiSuccessResponse<DashboardSummary>>(
      API_ROUTES.ADMIN.DASHBOARD.SUMMARY,
      { method: 'GET' }
    );
    return response.data.data;
  } catch (error) {
    if (getStatusCode(error) === 404) return getCompatibilityDashboardSummary();
    throw error;
  }
}

export async function getDatasetRatings(params: {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: DatasetRatingsSort;
}): Promise<PaginatedResponse<DatasetRatingItem>> {
  const response = await apiClient.get<
    ApiSuccessResponse<{
      items: DatasetRatingItem[];
      page: number;
      pageSize: number;
      total: number;
    }>
  >(`${API_ROUTES.ADMIN.DASHBOARD.DATASET_RATINGS}${buildQueryString(params)}`);
  const data = response.data.data;
  return {
    items: data.items,
    pagination: {
      page: data.page,
      pageSize: data.pageSize,
      total: data.total,
      totalPages: Math.ceil(data.total / data.pageSize),
    },
  };
}
