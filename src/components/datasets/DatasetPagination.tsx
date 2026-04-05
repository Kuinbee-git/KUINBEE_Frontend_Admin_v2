"use client";

import { Button } from "@/components/ui/button";

interface DatasetPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function DatasetPagination({ page, pageSize, total, totalPages, onPageChange }: DatasetPaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Showing {start} to {end} of {total} datasets
      </p>
      <div className="flex gap-2">
        <Button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          variant="outline"
          size="sm"
        >
          Previous
        </Button>
        <Button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          variant="outline"
          size="sm"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
