"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SourceFilters } from "./SourceFilters";
import { SourceTable } from "./SourceTable";
import { SourceDialogs } from "./SourceDialogs";
import { useSources, useCreateSource, useUpdateSource, useDeleteSource, useMyPermissions } from "@/hooks";
import { TableSkeleton } from "@/components/shared";
import { useDebounce } from "@/hooks/useDebounce";
import type { Source } from "@/types";

export function SourcesView() {
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filter state
  const [search, setSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [createdByTypeFilter, setCreatedByTypeFilter] = useState("all");

  // Dialog state
  const [dialogMode, setDialogMode] = useState<
    "create" | "edit" | "verify" | "delete" | null
  >(null);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

  // Form state
  const [sourceName, setSourceName] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Debounce search
  const debouncedSearch = useDebounce(search, 500);

  // Reset page to 1 when filters change
   
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, verificationFilter, createdByTypeFilter]);

  // Fetch sources
  const { data, isLoading, isError } = useSources();
  const allSources = useMemo(() => data?.items || [], [data?.items]);

  // Mutations
  const createMutation = useCreateSource();
  const updateMutation = useUpdateSource();
  const deleteMutation = useDeleteSource();

  // Permissions from API
  const { data: permissionsData } = useMyPermissions();
  const canCreate = permissionsData?.includes('sources:create') ?? false;
  const canUpdate = permissionsData?.includes('sources:update') ?? false;
  const canVerify = permissionsData?.includes('sources:verify') ?? false;
  const canDelete = permissionsData?.includes('sources:delete') ?? false;

  // Filtered sources
  const filteredSources = useMemo(() => {
    return allSources.filter((source) => {
      // Search filter
      if (
        debouncedSearch &&
        !source.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      ) {
        return false;
      }

      // Verification filter
      if (verificationFilter === "verified" && !source.isVerified) {
        return false;
      }
      if (verificationFilter === "unverified" && source.isVerified) {
        return false;
      }

      // Created by type filter
      if (
        createdByTypeFilter === "platform" &&
        source.createdByType !== "PLATFORM"
      ) {
        return false;
      }
      if (
        createdByTypeFilter === "supplier" &&
        source.createdByType !== "SUPPLIER"
      ) {
        return false;
      }

      return true;
    });
  }, [allSources, debouncedSearch, verificationFilter, createdByTypeFilter]);

  // Paginated sources
  const paginatedSources = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredSources.slice(startIndex, endIndex);
  }, [filteredSources, page, limit]);

  const totalPages = Math.ceil(filteredSources.length / limit);

  // Active filters for display
  const activeFilters = useMemo(() => [
    verificationFilter !== "all" && {
      key: "verification",
      label: `Verification: ${verificationFilter === "verified" ? "Verified" : "Unverified"}`,
      onRemove: () => setVerificationFilter("all"),
    },
    createdByTypeFilter !== "all" && {
      key: "createdByType",
      label: `Type: ${createdByTypeFilter.charAt(0).toUpperCase() + createdByTypeFilter.slice(1)}`,
      onRemove: () => setCreatedByTypeFilter("all"),
    },
  ].filter(Boolean) as { key: string; label: string; onRemove: () => void }[], [verificationFilter, createdByTypeFilter]);

  const handleCreate = useCallback(() => {
    setDialogMode("create");
    setSelectedSource(null);
    setSourceName("");
    setDescription("");
    setWebsiteUrl("");
  }, []);

  const handleEdit = useCallback((source: Source) => {
    if (!canUpdate) return;
    setDialogMode("edit");
    setSelectedSource(source);
    setSourceName(source.name);
    setDescription(source.description || "");
    setWebsiteUrl(source.websiteUrl || "");
  }, [canUpdate]);

  const handleVerify = useCallback((source: Source) => {
    if (!canVerify) return;
    setDialogMode("verify");
    setSelectedSource(source);
  }, [canVerify]);

  const handleDelete = useCallback((source: Source) => {
    if (!canDelete) return;
    setDialogMode("delete");
    setSelectedSource(source);
    setDeleteConfirmation("");
  }, [canDelete]);

  const handleSave = useCallback(async () => {
    if (!sourceName.trim()) return;

    const data = {
      name: sourceName.trim(),
      description: description.trim() || undefined,
      websiteUrl: websiteUrl.trim() || undefined,
    };

    if (dialogMode === "create") {
      await createMutation.mutateAsync(data);
    } else if (dialogMode === "edit" && selectedSource) {
      await updateMutation.mutateAsync({
        sourceId: selectedSource.id,
        data,
      });
    }

    setDialogMode(null);
  }, [sourceName, description, websiteUrl, dialogMode, selectedSource, createMutation, updateMutation]);

  const handleConfirmVerify = useCallback(async () => {
    if (!selectedSource) return;

    // Toggle verification status
    await updateMutation.mutateAsync({
      sourceId: selectedSource.id,
      data: { isVerified: !selectedSource.isVerified },
    });
    setDialogMode(null);
  }, [selectedSource, updateMutation]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedSource) return;

    await deleteMutation.mutateAsync(selectedSource.id);
    setDialogMode(null);
  }, [selectedSource, deleteMutation]);

  const handleCancel = useCallback(() => {
    setDialogMode(null);
    setSelectedSource(null);
    setSourceName("");
    setDescription("");
    setWebsiteUrl("");
    setDeleteConfirmation("");
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearch("");
    setVerificationFilter("all");
    setCreatedByTypeFilter("all");
    setPage(1);
  }, []);

  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Failed to load sources. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-surface)" }}>
      {/* Page Header */}
      <div
        className="p-6 border-b flex justify-between items-center"
        style={{
          backgroundColor: "var(--bg-base)",
          borderColor: "var(--border-default)",
        }}
      >
        <div>
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Dataset Origins
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Manage where datasets originate and track verification status
          </p>
        </div>
        <Button
          onClick={handleCreate}
          disabled={!canCreate}
          className="flex items-center gap-2"
          style={
            !canCreate
              ? {
                  backgroundColor: "var(--text-disabled)",
                  color: "#ffffff",
                  opacity: 0.5,
                  cursor: "not-allowed",
                }
              : { backgroundColor: "var(--brand-primary)", color: "#ffffff" }
          }
        >
          <Plus className="w-4 h-4" />
          Create Source
        </Button>
      </div>

      {/* Filters */}
      <SourceFilters
        searchQuery={search}
        setSearchQuery={setSearch}
        verificationFilter={verificationFilter}
        setVerificationFilter={setVerificationFilter}
        createdByTypeFilter={createdByTypeFilter}
        setCreatedByTypeFilter={setCreatedByTypeFilter}
        activeFilters={activeFilters}
        clearAllFilters={clearAllFilters}
      />

      {/* Table */}
      <div className="p-6">
        {/* Results Summary */}
        {!isLoading && (
          <div className="mb-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Showing <strong>{filteredSources.length}</strong> of{" "}
              <strong>{allSources.length}</strong> sources
            </p>
          </div>
        )}

        {isLoading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : filteredSources.length === 0 ? (
          <div className="p-12 text-center border rounded-lg" style={{ borderColor: 'var(--border-primary)' }}>
            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              No sources found
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              {activeFilters.length > 0
                ? 'Try adjusting your filters to see more results.'
                : 'There are no sources in the system yet.'}
            </p>
            {activeFilters.length > 0 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={clearAllFilters}
              >
                Clear Filters
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
              <SourceTable
                sources={paginatedSources}
                onRowClick={handleEdit}
                onVerifyClick={(source, e) => {
                  e.stopPropagation();
                  handleVerify(source);
                }}
                onDeleteClick={(source, e) => {
                  e.stopPropagation();
                  handleDelete(source);
                }}
                canUpdate={canUpdate}
              />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Showing {(page - 1) * limit + 1} to{' '}
                  {Math.min(page * limit, filteredSources.length)} of{' '}
                  {filteredSources.length} sources
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
        setSourceName={setSourceName}
        description={description}
        setDescription={setDescription}
        websiteUrl={websiteUrl}
        setWebsiteUrl={setWebsiteUrl}
        deleteConfirmation={deleteConfirmation}
        setDeleteConfirmation={setDeleteConfirmation}
        onSave={handleSave}
        onVerify={handleConfirmVerify}
        onDelete={handleConfirmDelete}
        onCancel={handleCancel}
      />
    </div>
  );
}
