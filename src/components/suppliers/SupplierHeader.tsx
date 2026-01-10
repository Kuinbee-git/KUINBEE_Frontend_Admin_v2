"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  StatusBadge,
  getKYCStatusSemantic,
  formatStatusLabel,
} from "@/components/shared/StatusBadge";

type KYCStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected"
  | "expired";

interface SupplierHeaderProps {
  supplierId: string;
  supplierName: string;
  supplierType: "individual" | "company";
  kycStatus: KYCStatus;
  createdDate: string;
  onBack: () => void;
}

export function SupplierHeader({
  supplierId,
  supplierName,
  supplierType,
  kycStatus,
  createdDate,
  onBack,
}: SupplierHeaderProps) {
  return (
    <div
      className="border-b px-6 py-4"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 -ml-2"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Suppliers
      </Button>

      {/* Header Content */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Name and KYC Badge */}
          <div className="flex items-center gap-3 mb-2">
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {supplierName}
            </h1>
            <StatusBadge
              status={formatStatusLabel(kycStatus)}
              semanticType={getKYCStatusSemantic(kycStatus)}
            />
          </div>

          {/* Meta Information */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span style={{ color: "var(--text-muted)" }}>Type:</span>
              <span
                className="font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {supplierType.charAt(0).toUpperCase() + supplierType.slice(1)}
              </span>
            </div>

            <div
              className="h-4 w-px"
              style={{ backgroundColor: "var(--border-default)" }}
            />

            <div className="flex items-center gap-2">
              <span style={{ color: "var(--text-muted)" }}>Supplier ID:</span>
              <span
                className="font-mono font-medium"
                style={{ color: "var(--brand-primary)" }}
              >
                {supplierId}
              </span>
            </div>

            <div
              className="h-4 w-px"
              style={{ backgroundColor: "var(--border-default)" }}
            />

            <div className="flex items-center gap-2">
              <span style={{ color: "var(--text-muted)" }}>Created:</span>
              <span style={{ color: "var(--text-secondary)" }}>
                {new Date(createdDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            style={{
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          >
            Edit Supplier
          </Button>
          <Button
            variant="outline"
            size="sm"
            style={{
              borderColor: "var(--status-error)",
              color: "var(--status-error)",
            }}
          >
            Suspend
          </Button>
        </div>
      </div>
    </div>
  );
}
