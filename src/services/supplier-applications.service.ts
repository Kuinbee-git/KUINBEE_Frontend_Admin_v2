import { apiClient } from '@/lib/api/client';
import type { SupplierWorkspaceDto, SupplierIdentity, SupplierCapabilities, SupplierReviewDecision } from '@/lib/supplier-onboarding-contracts';
export interface ApplicationRow {id: string; email: string; identity: SupplierIdentity; capabilities: SupplierCapabilities; applicationStatus: string; verificationStatus: string; userId: string | null; updatedAt: string}
const root = '/v1/admin/supplier-applications';
export const supplierApplications = {
  async list(params: {q: string; page: number; phase: string; state?: string}) {return (await apiClient.get<{data: {items: ApplicationRow[]; total: number; page: number; pageSize: number}}>(root, params)).data.data;},
  async get(id: string) {return (await apiClient.get<{data: SupplierWorkspaceDto}>(`${root}/${id}`)).data.data;},
  async action(id: string, action: string, body: unknown) {return (await apiClient.post<{data: SupplierWorkspaceDto}>(`${root}/${id}/${action}`, body)).data.data;},
  async decision(id: string, body: SupplierReviewDecision) {return this.action(id, 'decision', body);},
  async document(id: string, documentId: string) {return (await apiClient.get<{data: {url: string}}>(`${root}/${id}/documents/${documentId}`)).data.data;},
  async retry(id: string) {return (await apiClient.post<{data: {queued: number}}>(`${root}/${id}/notifications/retry`, {})).data.data;},
};
