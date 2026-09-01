'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupplierFilters } from '@/components/suppliers/SupplierFilters';
import { SupplierTable } from '@/components/suppliers/SupplierTable';
import { SupplierInvitesView } from '@/components/suppliers/SupplierInvitesView';
import { TableSkeleton } from '@/components/shared';
import { PageHeader } from '@/components/shared/PageHeader';
import { useSuppliers } from '@/hooks';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useDebounce } from '@/hooks/useDebounce';
import { PERMISSIONS } from '@/lib/constants/permissions';
import type { SupplierListParams } from '@/services/suppliers.service';
import type { BusinessDomain } from '@/types/supplier.types';

const PAGE_SIZE = 20;

const BUSINESS_DOMAINS: Array<{ value: BusinessDomain; label: string }> = [
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'ECOMMERCE', label: 'E-commerce' },
  { value: 'AGRICULTURE', label: 'Agriculture' },
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'GOVERNMENT', label: 'Government' },
  { value: 'RESEARCH', label: 'Research' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'SOCIAL_MEDIA', label: 'Social media' },
  { value: 'OTHER', label: 'Other' },
];

export function SuppliersView() {
  const router = useRouter();
  const { can } = useAuthorization();
  const canInvite = can({ anyOf: [PERMISSIONS.SUPPLIERS.INVITE] });
  const canViewDirectory = can({
    anyOf: [PERMISSIONS.SUPPLIERS.VIEW, PERMISSIONS.SUPPLIERS.MANAGE_VERIFICATION],
  });
  const [activeTab, setActiveTab] = useState(() => (canViewDirectory ? 'suppliers' : 'invites'));
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INDIVIDUAL' | 'COMPANY'>('ALL');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DELETED'
  >('ALL');
  const [selectedDomains, setSelectedDomains] = useState<BusinessDomain[]>([]);
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState('all');
  const debouncedSearch = useDebounce(searchQuery, 400);

  const apiParams: SupplierListParams = {
    page,
    pageSize: PAGE_SIZE,
    q: debouncedSearch || undefined,
    supplierType: typeFilter === 'ALL' ? undefined : typeFilter,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    contactEmailVerified:
      emailVerifiedFilter === 'all' ? undefined : emailVerifiedFilter === 'verified',
    businessDomains: selectedDomains.length ? selectedDomains : undefined,
    sort: 'createdAt:desc',
  };

  const query = useSuppliers(apiParams, { enabled: canViewDirectory });
  const suppliers = query.data?.items ?? [];
  const total = query.data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const clearAllFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setSelectedDomains([]);
    setEmailVerifiedFilter('all');
    setPage(1);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <PageHeader title="Suppliers" description="Manage supplier accounts and invitations." />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-4 pt-4 sm:px-6 sm:pt-6">
          <TabsList>
            {canViewDirectory ? <TabsTrigger value="suppliers">All suppliers</TabsTrigger> : null}
            {canInvite ? <TabsTrigger value="invites">Invites</TabsTrigger> : null}
          </TabsList>
        </div>

        {canViewDirectory ? (
          <TabsContent value="suppliers" className="mt-0">
            <SupplierFilters
              searchQuery={searchQuery}
              setSearchQuery={(value) => {
                setSearchQuery(value);
                setPage(1);
              }}
              typeFilter={typeFilter}
              setTypeFilter={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
              statusFilter={statusFilter}
              setStatusFilter={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              selectedDomains={selectedDomains}
              setSelectedDomains={(value) => {
                setSelectedDomains(value);
                setPage(1);
              }}
              emailVerifiedFilter={emailVerifiedFilter}
              setEmailVerifiedFilter={(value) => {
                setEmailVerifiedFilter(value);
                setPage(1);
              }}
              domainList={BUSINESS_DOMAINS}
              clearAllFilters={clearAllFilters}
            />

            <div className="p-4 sm:p-6">
              <div
                className="overflow-hidden rounded-lg border"
                style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
              >
                {query.isLoading ? (
                  <TableSkeleton rows={8} columns={6} />
                ) : query.isError ? (
                  <div className="px-6 py-14 text-center">
                    <p className="font-medium">Could not load suppliers</p>
                    <Button className="mt-4" variant="outline" onClick={() => query.refetch()}>
                      Retry
                    </Button>
                  </div>
                ) : suppliers.length ? (
                  <div className="overflow-x-auto">
                    <SupplierTable
                      suppliers={suppliers}
                      onRowClick={(supplierId) => router.push(`/dashboard/suppliers/${supplierId}`)}
                    />
                  </div>
                ) : (
                  <div className="px-6 py-14 text-center">
                    <p className="font-medium">No suppliers found</p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                      Try adjusting or clearing the current filters.
                    </p>
                    <Button className="mt-4" variant="outline" onClick={clearAllFilters}>
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>

              {!query.isLoading && !query.isError && total > 0 ? (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of{' '}
                    {total} suppliers
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1 || query.isFetching}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= totalPages || query.isFetching}
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </TabsContent>
        ) : null}

        {canInvite ? (
          <TabsContent value="invites" className="mt-0 p-4 sm:p-6">
            <SupplierInvitesView />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
