"use client";

import { Button } from "@/components/ui/button";

interface DatasetEmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function DatasetEmptyState({ hasActiveFilters, onClearFilters }: DatasetEmptyStateProps) {
  return (
    <div className="p-8 text-center">
      <p className="text-lg font-medium mb-2" style={{ color: "var(--text-primary)" }}>
        No datasets found
      </p>
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
        {hasActiveFilters ? "Try adjusting your filters" : "Get started by creating your first dataset"}
      </p>
      {hasActiveFilters && (
        <Button onClick={onClearFilters} variant="outline">
          Clear Filters
        </Button>
      )}
    </div>
  );
}
