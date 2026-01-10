"use client";

import { useState } from "react";
import { Shield, ChevronDown, ChevronUp, CheckCircle2, XCircle } from "lucide-react";
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

interface KYCCheck {
  id: string;
  name: string;
  status: "passed" | "failed" | "pending";
  completedDate?: string;
  notes?: string;
}

interface SupplierKYCStatusProps {
  kycProvider: string;
  kycStatus: KYCStatus;
  kycSubmittedDate?: string;
  kycApprovedDate?: string;
  kycExpiryDate?: string;
  checks: KYCCheck[];
}

export function SupplierKYCStatus({
  kycProvider,
  kycStatus,
  kycSubmittedDate,
  kycApprovedDate,
  kycExpiryDate,
  checks,
}: SupplierKYCStatusProps) {
  const [showChecks, setShowChecks] = useState(false);

  return (
    <div
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      <h2
        className="text-lg font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        KYC Verification
      </h2>

      <div className="space-y-6">
        {/* KYC Status Card */}
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: "var(--bg-base)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield
                className="h-5 w-5"
                style={{ color: "var(--brand-primary)" }}
              />
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {kycProvider}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  KYC Provider
                </p>
              </div>
            </div>
            <StatusBadge
              status={formatStatusLabel(kycStatus)}
              semanticType={getKYCStatusSemantic(kycStatus)}
            />
          </div>

          {/* Date Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kycSubmittedDate && (
              <div>
                <p
                  className="text-xs mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Submitted
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {new Date(kycSubmittedDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            {kycApprovedDate && (
              <div>
                <p
                  className="text-xs mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Approved
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {new Date(kycApprovedDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            {kycExpiryDate && (
              <div>
                <p
                  className="text-xs mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Expires
                </p>
                <p
                  className="text-sm font-medium"
                  style={{
                    color:
                      new Date(kycExpiryDate) < new Date()
                        ? "var(--status-error)"
                        : "var(--text-primary)",
                  }}
                >
                  {new Date(kycExpiryDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* KYC Checks Collapsible */}
        {checks.length > 0 && (
          <div>
            <button
              onClick={() => setShowChecks(!showChecks)}
              className="flex items-center justify-between w-full mb-3"
            >
              <h3
                className="text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Verification Checks ({checks.length})
              </h3>
              {showChecks ? (
                <ChevronUp
                  className="h-4 w-4"
                  style={{ color: "var(--text-muted)" }}
                />
              ) : (
                <ChevronDown
                  className="h-4 w-4"
                  style={{ color: "var(--text-muted)" }}
                />
              )}
            </button>

            {showChecks && (
              <div className="space-y-2">
                {checks.map((check) => (
                  <div
                    key={check.id}
                    className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: "var(--bg-base)",
                      borderColor: "var(--border-default)",
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        {check.status === "passed" ? (
                          <CheckCircle2
                            className="h-4 w-4 mt-0.5 flex-shrink-0"
                            style={{ color: "var(--status-success)" }}
                          />
                        ) : check.status === "failed" ? (
                          <XCircle
                            className="h-4 w-4 mt-0.5 flex-shrink-0"
                            style={{ color: "var(--status-error)" }}
                          />
                        ) : (
                          <div
                            className="h-4 w-4 mt-0.5 rounded-full border-2 flex-shrink-0"
                            style={{
                              borderColor: "var(--status-warning)",
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <p
                            className="text-sm font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {check.name}
                          </p>
                          {check.completedDate && (
                            <p
                              className="text-xs mt-0.5"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {new Date(check.completedDate).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </p>
                          )}
                          {check.notes && (
                            <p
                              className="text-xs mt-1"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {check.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor:
                            check.status === "passed"
                              ? "var(--bg-success)"
                              : check.status === "failed"
                              ? "var(--bg-error)"
                              : "var(--bg-warning)",
                          color:
                            check.status === "passed"
                              ? "var(--status-success)"
                              : check.status === "failed"
                              ? "var(--status-error)"
                              : "var(--status-warning)",
                        }}
                      >
                        {check.status.charAt(0).toUpperCase() +
                          check.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
