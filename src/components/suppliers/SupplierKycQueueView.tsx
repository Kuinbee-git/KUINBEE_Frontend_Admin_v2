"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useAuthStore } from "@/store/auth.store";
import {
  useSupplierManualKycQueue,
  usePickSupplierManualKyc,
  useVerifySupplierManualKyc,
  useRejectSupplierManualKyc,
} from "@/hooks";
import type { ManualKycStatus } from "@/types";

const statusBadgeClass: Record<ManualKycStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  VERIFIED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export function SupplierKycQueueView() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<"ALL" | ManualKycStatus>("PENDING");

  const queueQuery = useSupplierManualKycQueue({
    page,
    pageSize,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  const pickMutation = usePickSupplierManualKyc();
  const verifyMutation = useVerifySupplierManualKyc();
  const rejectMutation = useRejectSupplierManualKyc();

  const items = queueQuery.data?.items || [];
  const total = queueQuery.data?.pagination.total || 0;
  const totalPages = queueQuery.data?.pagination
    ? Math.ceil(queueQuery.data.pagination.total / queueQuery.data.pagination.pageSize)
    : 0;

  const isAnyActionPending =
    pickMutation.isPending || verifyMutation.isPending || rejectMutation.isPending;

  const canVerifyOrReject = useMemo(
    () => (pickedByAdminId: string | null) => !pickedByAdminId || pickedByAdminId === user?.id,
    [user?.id]
  );

  const handlePick = async (supplierId: string) => {
    await pickMutation.mutateAsync(supplierId);
  };

  const handleVerify = async (supplierId: string) => {
    await verifyMutation.mutateAsync(supplierId);
  };

  const handleReject = async (supplierId: string) => {
    const reason = window.prompt("Enter rejection reason")?.trim();
    if (!reason) return;
    await rejectMutation.mutateAsync({ supplierId, data: { reason } });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-surface)" }}>
      <div
        className="p-6 border-b"
        style={{
          backgroundColor: "var(--bg-base)",
          borderColor: "var(--border-default)",
        }}
      >
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Supplier KYC Queue
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Review manual supplier KYC submissions and process pick, verify, or reject actions.
        </p>
      </div>

      <div
        className="p-4 border-b"
        style={{
          backgroundColor: "var(--bg-base)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as "ALL" | ManualKycStatus);
              setPage(1);
            }}
          >
            <SelectTrigger
              className="w-[220px]"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            >
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-6">
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: "var(--bg-base)",
            borderColor: "var(--border-default)",
          }}
        >
          {queueQuery.isLoading ? (
            <TableSkeleton columns={7} rows={6} />
          ) : queueQuery.isError ? (
            <div className="p-8 text-center">
              <p className="text-red-500">Failed to load supplier KYC queue.</p>
              <Button className="mt-4" variant="outline" onClick={() => queueQuery.refetch()}>
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
                No suppliers in queue
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                Try changing filters or check back later.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "var(--border-default)" }}>
                  <TableHead>Supplier ID</TableHead>
                  <TableHead>Supplier Profile ID</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Picked By</TableHead>
                  <TableHead>Picked At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const canProcess = canVerifyOrReject(item.pickedByAdminId);
                  const isPending = item.status === "PENDING";
                  const canPick = isPending && !item.pickedByAdminId;

                  return (
                    <TableRow key={item.supplierId} style={{ borderColor: "var(--border-default)" }}>
                      <TableCell className="font-mono text-xs">{item.supplierId}</TableCell>
                      <TableCell className="font-mono text-xs">{item.supplierProfileId}</TableCell>
                      <TableCell>{new Date(item.submittedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass[item.status]}>{item.status}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{item.pickedByAdminId || "—"}</TableCell>
                      <TableCell>{item.pickedAt ? new Date(item.pickedAt).toLocaleString() : "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/dashboard/suppliers/${item.supplierId}`)}
                            disabled={isAnyActionPending}
                          >
                            View
                          </Button>
                          {canPick ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePick(item.supplierId)}
                              disabled={isAnyActionPending}
                            >
                              Pick
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            onClick={() => handleVerify(item.supplierId)}
                            disabled={!isPending || !canProcess || isAnyActionPending}
                          >
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleReject(item.supplierId)}
                            disabled={!isPending || !canProcess || isAnyActionPending}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {!queueQuery.isLoading && items.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} suppliers
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
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
