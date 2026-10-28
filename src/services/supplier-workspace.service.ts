import { apiClient } from '@/lib/api/client';
import type {
  SupplierDirectoryQuery,
  SupplierDirectoryResponse,
  SupplierAdminWorkspace,
} from '@/lib/supplier-workspace-contracts';
const root = '/v1/admin/suppliers/directory';
const path = (id: string) => `${root}/${encodeURIComponent(id)}`;
export const supplierWorkspace = {
  async list(params: SupplierDirectoryQuery, signal?: AbortSignal) {
    return (await apiClient.request<{ data: SupplierDirectoryResponse }>(root, { params, signal }))
      .data.data;
  },
  async get(id: string) {
    return (await apiClient.get<{ data: SupplierAdminWorkspace }>(path(id))).data.data;
  },
  async note(id: string, body: string) {
    return (await apiClient.post<{ data: { id: string } }>(`${path(id)}/notes`, { body })).data
      .data;
  },
  async evidence(id: string, file: File, summary: string, sourceUrl: string) {
    const contentType = file.name.toLowerCase().endsWith('.json')
      ? 'application/json'
      : file.name.toLowerCase().endsWith('.txt')
        ? 'text/plain'
        : file.type;
    return (
      await apiClient.request<{ data: { id: string } }>(`${path(id)}/evidence`, {
        method: 'POST',
        body: file,
        skipContentType: true,
        headers: {
          'content-type': contentType,
          'x-evidence-metadata': btoa(
            String.fromCharCode(
              ...new TextEncoder().encode(JSON.stringify({ name: file.name, summary, sourceUrl }))
            )
          ),
        },
      })
    ).data.data;
  },
  async history<T>(id: string, kind: 'NOTE' | 'EVIDENCE' | 'ACTIVITY' | 'INVITATION', cursor: string | null) {
    return (
      await apiClient.get<{ data: { items: T[]; nextCursor: string | null } }>(
        `${path(id)}/history`,
        { kind, cursor }
      )
    ).data.data;
  },
  async download(id: string, entryId: string) {
    return (
      await apiClient.get<{ data: { url: string } }>(
        `${path(id)}/evidence/${encodeURIComponent(entryId)}`
      )
    ).data.data;
  },
};
