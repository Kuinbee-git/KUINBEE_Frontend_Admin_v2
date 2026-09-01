'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SourceFilters } from './SourceFilters';
import { SourceTable } from './SourceTable';
import { SourceDialogs } from './SourceDialogs';
import { useSources, useCreateSource, useUpdateSource, useDeleteSource } from '@/hooks';
import { TableSkeleton } from '@/components/shared';
import { PageHeader } from '@/components/shared/PageHeader';
import { useDebounce } from '@/hooks/useDebounce';
import type { Source } from '@/types';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { getSafeHttpUrl } from '@/lib/utils/url.utils';
import { formatEnumLabel } from '@/components/shared/StatusBadge';

export function SourcesView() {
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filter state
  const [search, setSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [createdByTypeFilter, setCreatedByTypeFilter] = useState('all');

  // Dialog state
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'verify' | 'delete' | null>(
    null
  );
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

  // Form state
  const [sourceName, setSourceName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Debounce search
  const debouncedSearch = useDebounce(search, 500);

  // Fetch sources
  const { data, isLoading, isError, refetch } = useSources({
    page,
    pageSize: limit,
    q: debouncedSearch || undefined,
    isVerified: verificationFilter === 'all' ? undefined : verificationFilter === 'verified',
    createdByType:
      createdByTypeFilter === 'all'
        ? undefined
        : createdByTypeFilter === 'platform'
          ? 'PLATFORM'
          : 'SUPPLIER',
  });
  const sources = useMemo(() => data?.items ?? [], [data?.items]);

  // Mutations
  const createMutation = useCreateSource();
  const updateMutation = useUpdateSource();
  const deleteMutation = useDeleteSource();

  const { can } = useAuthorization();
  const canCreate = can({ anyOf: [PERMISSIONS.SOURCES.CREATE] });
  const canUpdate = can({ anyOf: [PERMISSIONS.SOURCES.UPDATE] });
  const canVerify = canUpdate;
  const canDelete = can({ anyOf: [PERMISSIONS.SOURCES.DELETE] });

  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? Math.ceil(total / limit);

  // Active filters for display
  const activeFilters = useMemo(
    () =>
      [
        verificationFilter !== 'all' && {
          key: 'verification',
          label: `Verification: ${verificationFilter === 'verified' ? 'Verified' : 'Unverified'}`,
          onRemove: () => {
            setVerificationFilter('all');
            setPage(1);
          },
        },
        createdByTypeFilter !== 'all' && {
          key: 'createdByType',
          label: `Type: ${formatEnumLabel(createdByTypeFilter)}`,
          onRemove: () => {
            setCreatedByTypeFilter('all');
            setPage(1);
          },
        },
      ].filter(Boolean) as { key: string; label: string; onRemove: () => void }[],
    [verificationFilter, createdByTypeFilter]
  );

  const handleCreate = useCallback(() => {
    setDialogMode('create');
    setSelectedSource(null);
    setSourceName('');
    setDescription('');
    setWebsiteUrl('');
    setFormError(null);
  }, []);

  const handleEdit = useCallback(
    (source: Source) => {
      if (!canUpdate || source.createdByType !== 'PLATFORM') return;
      setDialogMode('edit');
      setSelectedSource(source);
      setSourceName(source.name);
      setDescription(source.description || '');
      setWebsiteUrl(source.websiteUrl || '');
      setFormError(null);
    },
    [canUpdate]
  );

  const handleVerify = useCallback(
    (source: Source) => {
      if (!canVerify || source.createdByType !== 'PLATFORM') return;
      setDialogMode('verify');
      setSelectedSource(source);
    },
    [canVerify]
  );

  const handleDelete = useCallback(
    (source: Source) => {
      if (!canDelete || source.createdByType !== 'PLATFORM') return;
      setDialogMode('delete');
      setSelectedSource(source);
      setDeleteConfirmation('');
    },
    [canDelete]
  );

  const handleSave = useCallback(async () => {
    const name = sourceName.trim();
    const trimmedWebsiteUrl = websiteUrl.trim();
    if (!name) {
      setFormError('Source name is required.');
      return;
    }
    if (trimmedWebsiteUrl && !getSafeHttpUrl(trimmedWebsiteUrl)) {
      setFormError('Website URL must be a valid HTTP or HTTPS address.');
      return;
    }

    const data = {
      name,
      description: description.trim() || undefined,
      websiteUrl: trimmedWebsiteUrl || undefined,
    };

    setFormError(null);
    try {
      if (dialogMode === 'create') {
        await createMutation.mutateAsync(data);
      } else if (dialogMode === 'edit' && selectedSource) {
        await updateMutation.mutateAsync({
          sourceId: selectedSource.id,
          data,
        });
      }

      setDialogMode(null);
    } catch {
      // The mutation hook presents the error and keeps the form available for correction.
    }
  }, [
    sourceName,
    description,
    websiteUrl,
    dialogMode,
    selectedSource,
    createMutation,
    updateMutation,
  ]);

  const handleConfirmVerify = useCallback(async () => {
    if (!selectedSource) return;

    try {
      await updateMutation.mutateAsync({
        sourceId: selectedSource.id,
        data: { isVerified: !selectedSource.isVerified },
      });
      setDialogMode(null);
    } catch {
      // The mutation hook presents the error and keeps the confirmation open.
    }
  }, [selectedSource, updateMutation]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedSource) return;

    try {
      await deleteMutation.mutateAsync(selectedSource.id);
      if (sources.length === 1 && page > 1) setPage(page - 1);
      setDialogMode(null);
    } catch {
      // The mutation hook presents the error and keeps the confirmation open.
    }
  }, [deleteMutation, page, selectedSource, sources.length]);

  const handleCancel = useCallback(() => {
    setDialogMode(null);
    setSelectedSource(null);
    setSourceName('');
    setDescription('');
    setWebsiteUrl('');
    setFormError(null);
    setDeleteConfirmation('');
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearch('');
    setVerificationFilter('all');
    setCreatedByTypeFilter('all');
    setPage(1);
  }, []);

  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-[var(--status-error)]">Failed to load sources. Please try again.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <PageHeader
        title="Dataset Origins"
        description="Manage where datasets originate and track verification status"
        actions={
          canCreate ? (
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Source
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <SourceFilters
        searchQuery={search}
        setSearchQuery={(value) => {
          setSearch(value);
          setPage(1);
        }}
        verificationFilter={verificationFilter}
        setVerificationFilter={(value) => {
          setVerificationFilter(value);
          setPage(1);
        }}
        createdByTypeFilter={createdByTypeFilter}
        setCreatedByTypeFilter={(value) => {
          setCreatedByTypeFilter(value);
          setPage(1);
        }}
        activeFilters={activeFilters}
        clearAllFilters={clearAllFilters}
      />

      {/* Table */}
      <div className="p-4 sm:p-6">
        {/* Results Summary */}
        {!isLoading && (
          <div className="mb-4">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Showing <strong>{sources.length}</strong> of <strong>{total}</strong> matching sources
            </p>
          </div>
        )}

        {isLoading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : sources.length === 0 ? (
          <div
            className="p-12 text-center border rounded-lg"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              No sources found
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              {activeFilters.length > 0
                ? 'Try adjusting your filters to see more results.'
                : 'There are no sources in the system yet.'}
            </p>
            {activeFilters.length > 0 && (
              <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div
              className="rounded-lg border overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-base)',
                borderColor: 'var(--border-default)',
              }}
            >
              <SourceTable
                sources={sources}
                onRowClick={handleEdit}
                onVerifyClick={(source, e) => {
                  e.stopPropagation();
                  handleVerify(source);
                }}
                onDeleteClick={(source, e) => {
                  e.stopPropagation();
                  handleDelete(source);
                }}
                canVerify={canVerify}
                canDelete={canDelete}
              />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}{' '}
                  sources
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <SourceDialogs
        dialogMode={dialogMode}
        selectedSource={selectedSource}
        sourceName={sourceName}
        setSourceName={(value) => {
          setSourceName(value);
          setFormError(null);
        }}
        description={description}
        setDescription={(value) => {
          setDescription(value);
          setFormError(null);
        }}
        websiteUrl={websiteUrl}
        setWebsiteUrl={(value) => {
          setWebsiteUrl(value);
          setFormError(null);
        }}
        formError={formError}
        deleteConfirmation={deleteConfirmation}
        setDeleteConfirmation={setDeleteConfirmation}
        onSave={handleSave}
        onVerify={handleConfirmVerify}
        onDelete={handleConfirmDelete}
        onCancel={handleCancel}
        isBusy={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
}
