import { apiClient } from '@/lib/api/client';
import { buildQueryString } from '@/lib/utils/service.utils';
import type {
  ApiSuccessResponse,
  DataRequirementAction,
  DataRequirementDetail,
  DataRequirementListParams,
  DataRequirementPage,
  DataRequirementPatch,
} from '@/types';
import {
  getDemoDataRequirement,
  isDemoDataRequirement,
  listDemoDataRequirements,
} from './data-requirement.demo';

type BackendPage<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export async function listDataRequirements(
  params: DataRequirementListParams
): Promise<DataRequirementPage> {
  if (process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true') {
    return listDemoDataRequirements(params);
  }
  const response = await apiClient.get<
    ApiSuccessResponse<BackendPage<DataRequirementPage['items'][number]>>
  >(`/v1/admin/data-requirements${buildQueryString(params)}`);
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

export async function getDataRequirement(requirementId: string) {
  if (process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true' && isDemoDataRequirement(requirementId)) {
    const requirement = getDemoDataRequirement(requirementId);
    if (requirement) return requirement;
  }
  const response = await apiClient.get<ApiSuccessResponse<DataRequirementDetail>>(
    `/v1/admin/data-requirements/${requirementId}`
  );
  return response.data.data;
}

export async function patchDataRequirement({
  requirementId,
  ...body
}: DataRequirementPatch) {
  const response = await apiClient.patch<ApiSuccessResponse<DataRequirementDetail>>(
    `/v1/admin/data-requirements/${requirementId}`,
    body
  );
  return response.data.data;
}

export async function actionDataRequirement(args: {
  requirementId: string;
  action: DataRequirementAction;
  expectedVersion: number;
  note?: string;
  reason?: string;
}) {
  const response = await apiClient.post<ApiSuccessResponse<DataRequirementDetail>>(
    `/v1/admin/data-requirements/${args.requirementId}/${args.action}`,
    args.action === 'reject'
      ? { expectedVersion: args.expectedVersion, reason: args.reason }
      : { expectedVersion: args.expectedVersion, note: args.note || undefined }
  );
  return response.data.data;
}
