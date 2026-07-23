import { apiClient } from '@/lib/api/client';
import { buildQueryString } from '@/lib/utils/service.utils';
import type {
  ApiSuccessResponse,
  CustomCollectionLead,
  CustomCollectionLeadDetail,
  CustomCollectionLeadListParams,
  CustomCollectionLeadStatus,
  CustomCollectionListParams,
  CustomCollectionPaginated,
  CustomCollectionReviewEvent,
  CustomCollectionRevision,
  CustomCollectionServiceSummary,
} from '@/types';

type BackendPage<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

function unwrapPage<T>(payload: BackendPage<T>): CustomCollectionPaginated<T> {
  return {
    items: payload.items || [],
    pagination: {
      page: payload.page || 1,
      pageSize: payload.pageSize || 20,
      total: payload.total || 0,
      totalPages: Math.ceil((payload.total || 0) / (payload.pageSize || 20)),
    },
  };
}

export async function listCustomCollectionServices(
  params: CustomCollectionListParams = {}
): Promise<CustomCollectionPaginated<CustomCollectionServiceSummary>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<
    ApiSuccessResponse<BackendPage<CustomCollectionServiceSummary>>
  >(`/v1/admin/custom-collection-services${query}`);
  return unwrapPage(response.data.data);
}

export async function getCustomCollectionService(serviceId: string): Promise<{
  service: CustomCollectionServiceSummary;
  history: CustomCollectionReviewEvent[];
}> {
  const response = await apiClient.get<
    ApiSuccessResponse<{
      service: CustomCollectionServiceSummary;
      history: CustomCollectionReviewEvent[];
    }>
  >(`/v1/admin/custom-collection-services/${serviceId}`);
  return response.data.data;
}

export async function pickCustomCollectionRevision(args: {
  serviceId: string;
  revisionId: string;
}): Promise<CustomCollectionRevision> {
  const response = await apiClient.post<ApiSuccessResponse<{ revision: CustomCollectionRevision }>>(
    `/v1/admin/custom-collection-services/${args.serviceId}/revisions/${args.revisionId}/pick`
  );
  return response.data.data.revision;
}

export async function approveCustomCollectionRevision(args: {
  serviceId: string;
  revisionId: string;
  note?: string;
}): Promise<CustomCollectionRevision> {
  const response = await apiClient.post<ApiSuccessResponse<{ revision: CustomCollectionRevision }>>(
    `/v1/admin/custom-collection-services/${args.serviceId}/revisions/${args.revisionId}/approve`,
    { note: args.note || undefined }
  );
  return response.data.data.revision;
}

export async function requestCustomCollectionChanges(args: {
  serviceId: string;
  revisionId: string;
  note: string;
}): Promise<CustomCollectionRevision> {
  const response = await apiClient.post<ApiSuccessResponse<{ revision: CustomCollectionRevision }>>(
    `/v1/admin/custom-collection-services/${args.serviceId}/revisions/${args.revisionId}/request-changes`,
    { note: args.note }
  );
  return response.data.data.revision;
}

export async function rejectCustomCollectionRevision(args: {
  serviceId: string;
  revisionId: string;
  note: string;
}): Promise<CustomCollectionRevision> {
  const response = await apiClient.post<ApiSuccessResponse<{ revision: CustomCollectionRevision }>>(
    `/v1/admin/custom-collection-services/${args.serviceId}/revisions/${args.revisionId}/reject`,
    { note: args.note }
  );
  return response.data.data.revision;
}

export async function archiveCustomCollectionService(args: {
  serviceId: string;
  reason: string;
}): Promise<CustomCollectionServiceSummary> {
  const response = await apiClient.post<
    ApiSuccessResponse<{ service: CustomCollectionServiceSummary }>
  >(`/v1/admin/custom-collection-services/${args.serviceId}/archive`, { reason: args.reason });
  return response.data.data.service;
}

export async function listCustomCollectionLeads(
  params: CustomCollectionLeadListParams = {}
): Promise<CustomCollectionPaginated<CustomCollectionLead>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<ApiSuccessResponse<BackendPage<CustomCollectionLead>>>(
    `/v1/admin/custom-collection-leads${query}`
  );
  return unwrapPage(response.data.data);
}

export async function getCustomCollectionLead(leadId: string): Promise<CustomCollectionLeadDetail> {
  const response = await apiClient.get<ApiSuccessResponse<{ lead: CustomCollectionLeadDetail }>>(
    `/v1/admin/custom-collection-leads/${leadId}`
  );
  return response.data.data.lead;
}

export async function updateCustomCollectionLeadStatus(args: {
  leadId: string;
  status: CustomCollectionLeadStatus;
  note?: string;
}): Promise<CustomCollectionLead> {
  const response = await apiClient.post<ApiSuccessResponse<{ lead: CustomCollectionLead }>>(
    `/v1/admin/custom-collection-leads/${args.leadId}/status`,
    { status: args.status, note: args.note || undefined }
  );
  return response.data.data.lead;
}
