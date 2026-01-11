"use client";

import { CheckCircle2, XCircle, Building2, User } from "lucide-react";
import {
  StatusBadge,
  getKYCStatusSemantic,
  formatStatusLabel,
} from "@/components/shared/StatusBadge";
import { DataTable, ColumnDef } from "@/components/shared/DataTable";
import type { SupplierListItem } from "@/types";

type KycStatus = "PENDING" | "IN_PROGRESS" | "VERIFIED" | "REJECTED" | "FAILED";

interface SupplierTableProps {
  suppliers: SupplierListItem[];
  onRowClick: (supplierId: string) => void;
}

export function SupplierTable({
  suppliers,
  onRowClick,
}: SupplierTableProps) {
  const columns: ColumnDef<SupplierListItem>[] = [
    {
      header: "Supplier",
      accessor: (row) => row.supplier.email,
      render: (_, supplier: SupplierListItem) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {supplier.supplierProfile.supplierType === "COMPANY" ? (
              <Building2 className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            ) : (
              <User className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            )}
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {supplier.supplierProfile.supplierType === "COMPANY" 
                ? supplier.supplierProfile.companyName 
                : supplier.supplierProfile.individualName}
            </span>
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {supplier.supplier.email}
          </div>
          {supplier.supplierProfile.supplierType === "COMPANY" && supplier.supplierProfile.contactPersonName && (
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              Contact: {supplier.supplierProfile.contactPersonName}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (row) => row.supplier.status,
      render: (status: string) => (
        <StatusBadge
          status={formatStatusLabel(status)}
          semanticType={status === "ACTIVE" ? "success" : status === "SUSPENDED" ? "error" : "warning"}
        />
      ),
    },
    {
      header: "Business Domains",
      accessor: (row) => row.supplierProfile.businessDomains,
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
      accessor: (row) => row.kyc?.status,
      render: (_, supplier: SupplierListItem) => {
        if (!supplier.kyc) {
          return (
            <StatusBadge
              status="Not Started"
              semanticType="neutral"
            />
          );
        }
        return (
          <StatusBadge
            status={formatStatusLabel(supplier.kyc.status)}
            semanticType={getKYCStatusSemantic(supplier.kyc.status)}
          />
        );
      },
    },
    {
      header: "Contact Email",
      accessor: (row) => ({ email: row.supplierProfile.contactEmail, verified: row.supplierProfile.contactEmailVerified }),
      render: (data: { email: string; verified: boolean }) => (
        <div className="flex items-center gap-2">
          <span className="truncate max-w-45 text-sm">{data.email}</span>
          {data.verified ? (
            <CheckCircle2
              className="h-4 w-4 shrink-0"
              style={{ color: "var(--status-success)" }}
            />
          ) : (
            <XCircle
              className="h-4 w-4 shrink-0"
              style={{ color: "var(--status-error)" }}
            />
          )}
        </div>
      ),
    },
    {
      header: "Created",
      accessor: (row) => row.supplier.createdAt,
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
      onRowClick={(supplier) => onRowClick(supplier.supplier.id)}
      getRowKey={(supplier) => supplier.supplier.id}
      emptyMessage="No suppliers found"
    />
  );
}
