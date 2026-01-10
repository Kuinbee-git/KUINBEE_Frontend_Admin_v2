"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import {
  StatusBadge,
  getKYCStatusSemantic,
  formatStatusLabel,
} from "@/components/shared/StatusBadge";
import { DataTable, ColumnDef } from "@/components/shared/DataTable";

type KYCStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected"
  | "expired";

interface Supplier {
  id: string;
  name: string;
  type: "individual" | "company";
  businessDomains: string[];
  kycStatus: KYCStatus;
  email: string;
  emailVerified: boolean;
  datasetCount: number;
  createdDate: string;
}

interface SupplierTableProps {
  suppliers: Supplier[];
  onRowClick: (supplierId: string) => void;
}

export function SupplierTable({
  suppliers,
  onRowClick,
}: SupplierTableProps) {
  const columns: ColumnDef<Supplier>[] = [
    {
      header: "Supplier ID",
      accessor: "id",
      render: (id: string) => (
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {id}
        </span>
      ),
    },
    {
      header: "Name",
      accessor: "name",
      render: (name: string) => (
        <span className="text-sm" style={{ color: "var(--text-primary)" }}>
          {name}
        </span>
      ),
    },
    {
      header: "Type",
      accessor: "type",
      render: (type: string) => (
        <span className="text-sm">
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </span>
      ),
    },
    {
      header: "Business Domain",
      accessor: "businessDomains",
      render: (domains: string[]) =>
        domains.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {domains.slice(0, 2).map((domain) => (
              <span
                key={domain}
                className="px-2 py-0.5 text-xs rounded"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                }}
              >
                {domain}
              </span>
            ))}
            {domains.length > 2 && (
              <span className="px-2 py-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                +{domains.length - 2}
              </span>
            )}
          </div>
        ) : (
          <span style={{ color: "var(--text-muted)" }}>—</span>
        ),
    },
    {
      header: "KYC Status",
      accessor: "kycStatus",
      render: (status: KYCStatus) => (
        <StatusBadge
          status={formatStatusLabel(status)}
          semanticType={getKYCStatusSemantic(status)}
        />
      ),
    },
    {
      header: "Email",
      accessor: (row) => ({ email: row.email, verified: row.emailVerified }),
      render: (data: { email: string; verified: boolean }) => (
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[180px] text-sm">{data.email}</span>
          {data.verified ? (
            <CheckCircle2
              className="h-4 w-4 flex-shrink-0"
              style={{ color: "var(--status-success)" }}
            />
          ) : (
            <XCircle
              className="h-4 w-4 flex-shrink-0"
              style={{ color: "var(--status-error)" }}
            />
          )}
        </div>
      ),
    },
    {
      header: "Datasets",
      accessor: "datasetCount",
      align: "center",
      render: (count: number) =>
        count > 0 ? (
          <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
            {count}
          </span>
        ) : (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            0
          </span>
        ),
    },
    {
      header: "Created",
      accessor: "createdDate",
      render: (date: string) => (
        <span className="text-sm">
          {new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={suppliers}
      onRowClick={(supplier) => onRowClick(supplier.id)}
      getRowKey={(supplier) => supplier.id}
      emptyMessage="No suppliers found"
    />
  );
}
