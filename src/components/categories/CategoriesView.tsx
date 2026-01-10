"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CategoryTable } from "./CategoryTable";
import { CategoryFilters } from "./CategoryFilters";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useMyPermissions } from "@/hooks";
import { TableSkeleton } from "@/components/shared";
import { useDebounce } from "@/hooks/useDebounce";
import type { Category } from "@/types";

export function CategoriesView() {
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [usageFilter, setUsageFilter] = useState<string>("all");

  // Dialog state
  const [dialogMode, setDialogMode] = useState<
    "create" | "edit" | "delete" | null
  >(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  // Form state
  const [categoryName, setCategoryName] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Debounce search
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Reset page to 1 when filters change
   
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, usageFilter]);

  // Fetch categories
  const { data, isLoading, isError } = useCategories();
  const categories = useMemo(() => data?.items || [], [data?.items]);

  // Mutations
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // Permissions from API
  const { data: permissionsData } = useMyPermissions();
  const permissions = {
    canCreateCategory: permissionsData?.includes('categories:create') ?? false,
    canUpdateCategory: permissionsData?.includes('categories:update') ?? false,
    canDeleteCategory: permissionsData?.includes('categories:delete') ?? false,
  };

  // Apply filters
  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      if (
        debouncedSearchQuery &&
        !category.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      ) {
        return false;
      }

      const datasetsCount = category.datasetCount || 0;
      if (usageFilter === "used" && datasetsCount === 0) {
        return false;
      }
      if (usageFilter === "unused" && datasetsCount > 0) {
        return false;
      }

      return true;
    });
  }, [categories, debouncedSearchQuery, usageFilter]);

  // Paginated categories
  const paginatedCategories = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredCategories.slice(startIndex, endIndex);
  }, [filteredCategories, page, limit]);

  const totalPages = Math.ceil(filteredCategories.length / limit);

  const handleRowClick = useCallback((category: Category) => {
    if (!permissions.canUpdateCategory) return;
    setSelectedCategory(category);
    setCategoryName(category.name);
    setDialogMode("edit");
  }, [permissions.canUpdateCategory]);

  const handleCreateClick = useCallback(() => {
    setSelectedCategory(null);
    setCategoryName("");
    setDialogMode("create");
  }, []);

  const handleDeleteClick = useCallback((category: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCategory(category);
    setDeleteConfirmation("");
    setDialogMode("delete");
  }, []);

  const handleSave = useCallback(async () => {
    if (!categoryName.trim()) return;

    if (dialogMode === "create") {
      await createMutation.mutateAsync({ name: categoryName.trim() });
    } else if (dialogMode === "edit" && selectedCategory) {
      await updateMutation.mutateAsync({
        categoryId: selectedCategory.id,
        data: { name: categoryName.trim() },
      });
    }

    setDialogMode(null);
    setCategoryName("");
    setSelectedCategory(null);
  }, [categoryName, dialogMode, selectedCategory, createMutation, updateMutation]);

  const handleDelete = useCallback(async () => {
    if (!selectedCategory) return;

    await deleteMutation.mutateAsync(selectedCategory.id);
    setDialogMode(null);
    setDeleteConfirmation("");
    setSelectedCategory(null);
  }, [selectedCategory, deleteMutation]);

  const handleCancel = useCallback(() => {
    setDialogMode(null);
    setCategoryName("");
    setSelectedCategory(null);
    setDeleteConfirmation("");
  }, []);

  const canDelete =
    selectedCategory && deleteConfirmation === selectedCategory.name;

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setUsageFilter("all");
    setPage(1);
  }, []);

  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Failed to load categories. Please try again.</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg-surface)" }}
    >
      {/* Page Header */}
      <div
        className="p-6 border-b"
        style={{
          backgroundColor: "var(--bg-base)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Categories
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Manage dataset classification taxonomy
            </p>
          </div>
          {permissions.canCreateCategory && (
            <Button
              onClick={handleCreateClick}
              style={{
                backgroundColor: "var(--brand-primary)",
                color: "#ffffff",
              }}
            >
              Create Category
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <CategoryFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        usageFilter={usageFilter}
        setUsageFilter={setUsageFilter}
        clearAllFilters={clearAllFilters}
      />

      {/* Table */}
      <div className="p-6">
        {isLoading ? (
          <TableSkeleton rows={8} columns={4} />
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center border rounded-lg" style={{ borderColor: 'var(--border-primary)' }}>
            <p
              className="text-lg font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              No categories found
            </p>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
              {searchQuery
                ? "No categories match your search"
                : "No categories match the selected filters"}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSearchQuery("")}
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
                backgroundColor: "var(--bg-base)",
                borderColor: "var(--border-default)",
              }}
            >
              <CategoryTable
                categories={paginatedCategories}
                onRowClick={handleRowClick}
                onDeleteClick={handleDeleteClick}
                canDelete={permissions.canDeleteCategory}
              />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Showing {(page - 1) * limit + 1} to{' '}
                  {Math.min(page * limit, filteredCategories.length)} of{' '}
                  {filteredCategories.length} categories
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
      <Dialog
        open={dialogMode === "create" || dialogMode === "edit"}
        onOpenChange={handleCancel}
      >
        <DialogContent
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-default)",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "var(--text-primary)" }}>
              {dialogMode === "create" ? "Create Category" : "Edit Category"}
            </DialogTitle>
            <DialogDescription style={{ color: "var(--text-muted)" }}>
              {dialogMode === "create"
                ? "Create a new dataset classification category."
                : "Update category information."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label
                htmlFor="category-name"
                className="text-xs mb-2 block"
                style={{ color: "var(--text-muted)" }}
              >
                Category Name{" "}
                <span style={{ color: "var(--status-error)" }}>*</span>
              </Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Enter category name..."
                style={{
                  backgroundColor: "var(--bg-base)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {dialogMode === "edit" && selectedCategory && (
              <>
                <Separator
                  style={{ backgroundColor: "var(--border-default)" }}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label
                      className="text-xs mb-1 block"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Created By
                    </Label>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {selectedCategory.createdBy}
                    </p>
                  </div>
                  <div>
                    <Label
                      className="text-xs mb-1 block"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Created At
                    </Label>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {new Date(selectedCategory.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
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
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-primary)",
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
                      backgroundColor: "var(--text-disabled)",
                      color: "#ffffff",
                      opacity: 0.5,
                      cursor: "not-allowed",
                    }
                  : {
                      backgroundColor: "var(--brand-primary)",
                      color: "#ffffff",
                    }
              }
            >
              {dialogMode === "create" ? "Create" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={dialogMode === "delete"} onOpenChange={handleCancel}>
        <DialogContent
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-default)",
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
              >
                <AlertTriangle
                  className="w-5 h-5"
                  style={{ color: "var(--status-error)" }}
                />
              </div>
              <div>
                <DialogTitle style={{ color: "var(--text-primary)" }}>
                  Delete Category
                </DialogTitle>
                <DialogDescription style={{ color: "var(--text-muted)" }}>
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
                  backgroundColor: "rgba(239, 68, 68, 0.05)",
                  borderColor: "var(--status-error)",
                }}
              >
                <p
                  className="text-sm font-medium mb-2"
                  style={{ color: "var(--status-error)" }}
                >
                  <strong>Warning:</strong> This category is used by{" "}
                  {selectedCategory.datasetCount} dataset
                  {selectedCategory.datasetCount !== 1 ? "s" : ""}.
                </p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Deleting this category will not automatically reclassify
                  these datasets. Consider cancelling or migrating datasets
                  before deletion.
                </p>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                You are about to delete the category{" "}
                <strong>&quot;{selectedCategory?.name}&quot;</strong>.
              </p>
            )}

            <div>
              <Label
                htmlFor="delete-confirmation"
                className="text-xs mb-2 block"
                style={{ color: "var(--text-muted)" }}
              >
                Type the category name to confirm:{" "}
                <strong>{selectedCategory?.name}</strong>
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type category name..."
                style={{
                  backgroundColor: "var(--bg-base)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleCancel}
              style={{
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-primary)",
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
                      backgroundColor: "var(--text-disabled)",
                      color: "#ffffff",
                      opacity: 0.5,
                      cursor: "not-allowed",
                    }
                  : { backgroundColor: "var(--status-error)", color: "#ffffff" }
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
