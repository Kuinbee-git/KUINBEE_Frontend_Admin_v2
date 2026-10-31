import { catalogueClient, type CatalogueRequest } from '@/lib/catalogue-imports';
import { apiClient } from '@/lib/api/client';
const request: CatalogueRequest = async (path, schema, options = {}) => {
  const response = await apiClient.request<unknown>(path, {
    ...options,
    cache: 'no-store',
    timeoutMs: 90_000,
  });
  const envelope = response.data;
  if (
    !envelope ||
    typeof envelope !== 'object' ||
    !('success' in envelope) ||
    envelope.success !== true ||
    !('data' in envelope)
  )
    throw new Error('The import response could not be verified. Refresh before continuing.');
  try {
    return schema.parse(envelope.data);
  } catch {
    throw new Error(
      'The import response could not be verified. Your request is retained; retry to confirm its result.'
    );
  }
};
export function adminCatalogueApi(supplierId: string) {
  return catalogueClient(request, `/v2/admin/suppliers/${encodeURIComponent(supplierId)}`);
}
