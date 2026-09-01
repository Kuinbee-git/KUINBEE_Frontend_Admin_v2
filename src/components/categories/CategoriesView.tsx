'use client';

import { useState, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { CategoryTable } from './CategoryTable';
import { CategoryFilters } from './CategoryFilters';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks';
import { TableSkeleton } from '@/components/shared';
import { PageHeader } from '@/components/shared/PageHeader';
import { useDebounce } from '@/hooks/useDebounce';
import type { Category } from '@/types';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';

export function CategoriesView() {
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [usageFilter, setUsageFilter] = useState<string>('all');

  // Dialog state
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Form state
  const [categoryName, setCategoryName] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Debounce search
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Fetch categories
  const { data, isLoading, isError, refetch } = useCategories({
    page,
    pageSize: limit,
    q: debouncedSearchQuery || undefined,
    usage: usageFilter === 'all' ? undefined : usageFilter === 'used' ? 'USED' : 'UNUSED',
  });
  const categories = data?.items ?? [];

  // Mutations
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const { can } = useAuthorization();
  const canCreateCategory = can({ anyOf: [PERMISSIONS.CATEGORIES.CREATE] });
  const canUpdateCategory = can({ anyOf: [PERMISSIONS.CATEGORIES.UPDATE] });
  const canDeleteCategory = can({ anyOf: [PERMISSIONS.CATEGORIES.DELETE] });

  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? Math.ceil(total / limit);

  const handleRowClick = useCallback(
    (category: Category) => {
      if (!canUpdateCategory) return;
      setSelectedCategory(category);
      setCategoryName(category.name);
      setDialogMode('edit');
    },
    [canUpdateCategory]
  );

  const handleCreateClick = useCallback(() => {
    setSelectedCategory(null);
    setCategoryName('');
    setDialogMode('create');
  }, []);

  const handleDeleteClick = useCallback((category: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCategory(category);
    setDeleteConfirmation('');
    setDialogMode('delete');
  }, []);

  const handleSave = useCallback(async () => {
    if (!categoryName.trim()) return;

    try {
      if (dialogMode === 'create') {
        await createMutation.mutateAsync({ name: categoryName.trim() });
      } else if (dialogMode === 'edit' && selectedCategory) {
        await updateMutation.mutateAsync({
          categoryId: selectedCategory.id,
          data: { name: categoryName.trim() },
        });
      }

      setDialogMode(null);
      setCategoryName('');
      setSelectedCategory(null);
    } catch {
      // The mutation hook presents the error and keeps the form available for correction.
    }
  }, [categoryName, dialogMode, selectedCategory, createMutation, updateMutation]);

  const handleDelete = useCallback(async () => {
    if (!selectedCategory) return;

    try {
      await deleteMutation.mutateAsync(selectedCategory.id);
      if (categories.length === 1 && page > 1) setPage(page - 1);
      setDialogMode(null);
      setDeleteConfirmation('');
      setSelectedCategory(null);
    } catch {
      // The mutation hook presents the error and keeps the confirmation open.
    }
  }, [categories.length, deleteMutation, page, selectedCategory]);

  const handleCancel = useCallback(() => {
    setDialogMode(null);
    setCategoryName('');
    setSelectedCategory(null);
    setDeleteConfirmation('');
  }, []);

  const canDelete = selectedCategory && deleteConfirmation === selectedCategory.name;

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setUsageFilter('all');
    setPage(1);
  }, []);

  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-[var(--status-error)]">Failed to load categories. Please try again.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <PageHeader
        title="Categories"
        description="Manage dataset classification taxonomy"
        actions={
          canCreateCategory ? (
            <Button onClick={handleCreateClick}>Create Category</Button>
          ) : undefined
        }
      />

      {/* Filter Bar */}
      <CategoryFilters
        searchQuery={searchQuery}
        setSearchQuery={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        usageFilter={usageFilter}
        setUsageFilter={(value) => {
          setUsageFilter(value);
          setPage(1);
        }}
        clearAllFilters={clearAllFilters}
      />

      {/* Table */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <TableSkeleton rows={8} columns={4} />
        ) : categories.length === 0 ? (
          <div
            className="p-12 text-center border rounded-lg"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              No categories found
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              {searchQuery
                ? 'No categories match your search'
                : 'No categories match the selected filters'}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
              >
                Clear search
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
              <CategoryTable
                categories={categories}
                onRowClick={handleRowClick}
                onDeleteClick={handleDeleteClick}
                canDelete={canDeleteCategory}
              />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}{' '}
                  categories
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogMode === 'create' || dialogMode === 'edit'} onOpenChange={handleCancel}>
        <DialogContent
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--text-primary)' }}>
              {dialogMode === 'create' ? 'Create Category' : 'Edit Category'}
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--text-muted)' }}>
              {dialogMode === 'create'
                ? 'Create a new dataset classification category.'
                : 'Update category information.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label
                htmlFor="category-name"
                className="text-xs mb-2 block"
                style={{ color: 'var(--text-muted)' }}
              >
                Category Name <span style={{ color: 'var(--status-error)' }}>*</span>
              </Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Enter category name..."
                maxLength={200}
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {dialogMode === 'edit' && selectedCategory && (
              <>
                <Separator style={{ backgroundColor: 'var(--border-default)' }} />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      Created By
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {selectedCategory.createdByUser?.name || 'Admin unavailable'}
                    </p>
                    {selectedCategory.createdByUser?.email ? (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {selectedCategory.createdByUser.email}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <p className="mb-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      Created At
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(selectedCategory.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={handleCancel}
              style={{
                backgroundColor: 'var(--bg-hover)',
                color: 'var(--text-primary)',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!categoryName.trim()}
              style={
                !categoryName.trim()
                  ? {
                      backgroundColor: 'var(--text-disabled)',
                      color: 'var(--brand-on-primary)',
                      opacity: 0.5,
                      cursor: 'not-allowed',
                    }
                  : {
                      backgroundColor: 'var(--brand-primary)',
                      color: 'var(--brand-on-primary)',
                    }
              }
            >
              {dialogMode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={dialogMode === 'delete'} onOpenChange={handleCancel}>
        <DialogContent
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--status-error-bg)' }}
              >
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--status-error)' }} />
              </div>
              <div>
                <DialogTitle style={{ color: 'var(--text-primary)' }}>Delete Category</DialogTitle>
                <DialogDescription style={{ color: 'var(--text-muted)' }}>
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedCategory && (selectedCategory.datasetCount || 0) > 0 ? (
              <div
                className="p-4 rounded-lg border-l-4"
                style={{
                  backgroundColor: 'var(--status-error-bg)',
                  borderColor: 'var(--status-error)',
                }}
              >
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--status-error)' }}>
                  <strong>Warning:</strong> This category is used by {selectedCategory.datasetCount}{' '}
                  dataset
                  {selectedCategory.datasetCount !== 1 ? 's' : ''}.
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Deleting this category will not automatically reclassify these datasets. Consider
                  cancelling or migrating datasets before deletion.
                </p>
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You are about to delete the category{' '}
                <strong>&quot;{selectedCategory?.name}&quot;</strong>.
              </p>
            )}

            <div>
              <Label
                htmlFor="delete-confirmation"
                className="text-xs mb-2 block"
                style={{ color: 'var(--text-muted)' }}
              >
                Type the category name to confirm: <strong>{selectedCategory?.name}</strong>
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type category name..."
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleCancel}
              style={{
                backgroundColor: 'var(--bg-hover)',
                color: 'var(--text-primary)',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={!canDelete}
              style={
                !canDelete
                  ? {
                      backgroundColor: 'var(--text-disabled)',
                      color: 'var(--brand-on-primary)',
                      opacity: 0.5,
                      cursor: 'not-allowed',
                    }
                  : { backgroundColor: 'var(--status-error)', color: 'var(--brand-on-primary)' }
              }
            >
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
