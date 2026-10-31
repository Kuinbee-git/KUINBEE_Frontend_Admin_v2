'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useAuthorization } from '@/hooks/useAuthorization';
import { adminCatalogueApi } from '@/services/catalogue-imports.service';
import { CatalogueCapacityPanel } from '@/components/catalogue/CatalogueImportWorkspace';
import { DATASET_CATALOGUE_IMPORT_ENABLED } from '@/lib/catalogue-import-environment';
import { DATASET_CONTENT_ADMIN_ENABLED } from '@/lib/dataset-content-environment';
export function SupplierCatalogueSection({ supplierId }: { supplierId: string }) {
  const { can } = useAuthorization();
  const api = useMemo(() => adminCatalogueApi(supplierId), [supplierId]);
  const canImport = can({ allOf: ['VIEW_SUPPLIER', 'IMPORT_SUPPLIER_CATALOGUE'] });
  const canCapacity = can({ allOf: ['VIEW_SUPPLIER', 'MANAGE_SUPPLIER_PREPARATION_CAPACITY'] });
  if (!DATASET_CONTENT_ADMIN_ENABLED || (!canImport && !canCapacity)) return null;
  return (
    <div className="space-y-4">
      <CatalogueCapacityPanel api={api} canManage={canCapacity} />
      {canImport && DATASET_CATALOGUE_IMPORT_ENABLED && (
        <section className="space-y-3 rounded-xl border bg-background p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Private catalogue preparation</h2>
          <p className="text-sm text-muted-foreground">
            Import collection metadata for this supplier. Existing drafts are matched by catalogue
            identifier. Saving does not submit for review, publish or grant buyer access.
          </p>
          <Link
            className="inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium underline-offset-4 hover:underline"
            href={`/dashboard/suppliers/${encodeURIComponent(supplierId)}/catalogue`}
          >
            Open private catalogue import
          </Link>
        </section>
      )}
    </div>
  );
}
