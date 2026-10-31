'use client';
import { use, useMemo } from 'react';
import Link from 'next/link';
import {
  CatalogueImportWorkspace,
  CatalogueCapacityPanel,
} from '@/components/catalogue/CatalogueImportWorkspace';
import { useAuthorization } from '@/hooks/useAuthorization';
import { adminCatalogueApi } from '@/services/catalogue-imports.service';
import { getSupplierById } from '@/services/suppliers.service';
import { useQuery } from '@tanstack/react-query';
import { DATASET_CATALOGUE_IMPORT_ENABLED } from '@/lib/catalogue-import-environment';
import { DATASET_CONTENT_ADMIN_ENABLED } from '@/lib/dataset-content-environment';
export default function SupplierCataloguePage({
  params,
}: {
  params: Promise<{ supplierId: string }>;
}) {
  const { supplierId } = use(params),
    { can, user } = useAuthorization();
  const canImport = can({ allOf: ['VIEW_SUPPLIER', 'IMPORT_SUPPLIER_CATALOGUE'] }),
    canCapacity = can({ allOf: ['VIEW_SUPPLIER', 'MANAGE_SUPPLIER_PREPARATION_CAPACITY'] });
  const api = useMemo(() => adminCatalogueApi(supplierId), [supplierId]);
  const supplier = useQuery({
    queryKey: ['catalogue-supplier', supplierId, user?.id],
    queryFn: () => getSupplierById(supplierId),
    enabled: canImport || canCapacity,
  });
  return (
    <>
      <div className="px-4 pt-5 sm:px-6">
        <Link
          className="text-sm underline underline-offset-4"
          href={`/dashboard/suppliers/${encodeURIComponent(supplierId)}`}
        >
          Back to supplier
        </Link>
      </div>
      {DATASET_CONTENT_ADMIN_ENABLED &&
      DATASET_CATALOGUE_IMPORT_ENABLED &&
      (canImport || canCapacity) &&
      user ? (
        canImport ? (
          <CatalogueImportWorkspace
            api={api}
            canImport={canImport}
            canManageCapacity={canCapacity}
            ownerLabel={`Supplier ${supplierId}${supplier.data ? ' · ' + (supplier.data.supplierProfile.companyName || supplier.data.supplierProfile.individualName || supplier.data.supplier.email) : ''}`}
            storageKey={`catalogue-import:admin:${user.id}:${supplierId}`}
          />
        ) : (
          <div className="p-6">
            <CatalogueCapacityPanel api={api} canManage={canCapacity} />
          </div>
        )
      ) : (
        <p className="p-6">
          You do not have access to catalogue import, or it is not enabled in this environment.
        </p>
      )}
    </>
  );
}
