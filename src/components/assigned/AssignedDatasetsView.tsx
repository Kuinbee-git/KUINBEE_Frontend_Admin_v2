"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Clock, CheckCircle, XCircle, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useAssignedDatasets } from "@/hooks";
import type { AssignedDatasetListItem, AssignmentStatus, DatasetStatus } from "@/types";

type StatusFilterType = AssignmentStatus | "all";

function getAssignmentStatusBadge(status: AssignmentStatus) {
  const config: Record<AssignmentStatus, { label: string; className: string; icon: typeof Clock }> = {
    ACTIVE: {
      label: "Active",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      icon: Clock,
    },
    COMPLETED: {
      label: "Completed",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      icon: CheckCircle,
    },
    REASSIGNED: {
      label: "Reassigned",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      icon: RefreshCw,
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
      icon: XCircle,
    },
  };

  const { label, className, icon: Icon } = config[status];

  return (
    <Badge variant="outline" className={`gap-1 ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}

function getDatasetStatusBadge(status: DatasetStatus) {
  const config: Record<DatasetStatus, { label: string; className: string }> = {
    SUBMITTED: {
      label: "Submitted",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    UNDER_REVIEW: {
      label: "Under Review",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    VERIFIED: {
      label: "Verified",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    REJECTED: {
      label: "Rejected",
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
    PUBLISHED: {
      label: "Published",
      className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    ARCHIVED: {
      label: "Archived",
      className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    },
  };

  const { label, className } = config[status] || { label: status, className: "" };

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

export function AssignedDatasetsView() {
  const router = useRouter();

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ACTIVE");

  // Reset page when filters change
   
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // Build API params
  const params = useMemo(() => ({
    page,
    pageSize: limit,
    status: statusFilter !== "all" ? statusFilter : undefined,
  }), [page, limit, statusFilter]);

  // Fetch assigned datasets
  const { data, isLoading, isError } = useAssignedDatasets(params);
  const assignments = data?.items || [];
  const totalPages = data?.pagination ? Math.ceil(data.pagination.total / data.pagination.pageSize) : 0;

  // Handlers
  const handleRowClick = useCallback((item: AssignedDatasetListItem) => {
    router.push(`/dashboard/datasets/${item.dataset.datasetUniqueId}`);
  }, [router]);

  const handleClearFilters = useCallback(() => {
    setStatusFilter("ACTIVE");
    setPage(1);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-surface)" }}>
      {/* Page Header */}
      <div
        className="p-6 border-b"
        style={{
          backgroundColor: "var(--bg-base)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: "var(--brand-primary-light, rgba(59, 130, 246, 0.1))" }}
            >
              <ClipboardList className="w-6 h-6" style={{ color: "var(--brand-primary)" }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                My Queue
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                Datasets assigned to you for review
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="p-4 border-b"
        style={{
          backgroundColor: "var(--bg-base)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilterType)}
          >
            <SelectTrigger
              className="w-[180px]"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            >
              <SelectValue placeholder="Assignment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignments</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="REASSIGNED">Reassigned</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="p-6">
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: "var(--bg-base)",
            borderColor: "var(--border-default)",
          }}
        >
          {isLoading ? (
            <TableSkeleton columns={5} rows={5} />
          ) : isError ? (
            <div className="p-8 text-center">
              <p className="text-red-500">Failed to load assignments. Please try again.</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
              <p className="text-lg font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                No assignments found
              </p>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                {statusFilter !== "all"
                  ? "Try changing the status filter"
                  : "You don't have any datasets assigned for review"}
              </p>
              {statusFilter !== "all" && statusFilter !== "ACTIVE" && (
                <Button onClick={handleClearFilters} variant="outline">
                  Show Active Assignments
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-default)",
                  }}
                >
                  <TableHead style={{ color: "var(--text-muted)" }}>Dataset</TableHead>
                  <TableHead style={{ color: "var(--text-muted)" }}>Owner Type</TableHead>
                  <TableHead style={{ color: "var(--text-muted)" }}>Dataset Status</TableHead>
                  <TableHead style={{ color: "var(--text-muted)" }}>Assignment Status</TableHead>
                  <TableHead style={{ color: "var(--text-muted)" }}>Assigned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((item) => (
                  <TableRow
                    key={item.assignment.id}
                    className="cursor-pointer hover:bg-muted/50"
                    style={{ borderColor: "var(--border-default)" }}
                    onClick={() => handleRowClick(item)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                          {item.dataset.title}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {item.dataset.datasetUniqueId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.dataset.ownerType === "PLATFORM" ? "Platform" : "Supplier"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getDatasetStatusBadge(item.dataset.status)}
                    </TableCell>
                    <TableCell>
                      {getAssignmentStatusBadge(item.assignment.status)}
                    </TableCell>
                    <TableCell style={{ color: "var(--text-muted)" }}>
                      {new Date(item.assignment.assignedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && assignments.length > 0 && data?.pagination && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.pagination.total)} of {data.pagination.total} assignments
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
