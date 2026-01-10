"use client";

import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, getDatasetStatusSemantic, formatStatusLabel } from "@/components/shared/StatusBadge";

interface DatasetHeaderProps {
  datasetId: string;
  datasetName: string;
  ownerType: "platform" | "supplier";
  currentStatus: string;
  lastUpdated: string;
  assignedReviewer?: {
    id: string;
    name: string;
  };
  canReassign: boolean;
  onBack: () => void;
  onReassign?: () => void;
}

export function DatasetHeader({
  datasetId,
  datasetName,
  ownerType,
  currentStatus,
  lastUpdated,
  assignedReviewer,
  canReassign,
  onBack,
  onReassign,
}: DatasetHeaderProps) {
  return (
    <div
      className="sticky top-0 z-10 p-6 border-b"
      style={{
        backgroundColor: "var(--bg-base)",
        borderColor: "var(--border-default)",
      }}
    >
      <div className="mb-4">
        <Button
          onClick={onBack}
          style={{
            backgroundColor: "var(--bg-hover)",
            color: "var(--text-primary)",
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Datasets
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ color: "var(--text-primary)" }}>{datasetName}</h1>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <StatusBadge
              status={formatStatusLabel(currentStatus)}
              semanticType={getDatasetStatusSemantic(currentStatus)}
            />
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {ownerType === "platform" ? "Platform Dataset" : "Supplier Dataset"}
            </span>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              •
            </span>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              ID: {datasetId}
            </span>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              •
            </span>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              Updated: {new Date(lastUpdated).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          {assignedReviewer && (
            <div className="flex items-center gap-2 mt-2">
              <User className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Assigned to: {assignedReviewer.name}
              </span>
              {canReassign && onReassign && (
                <Button
                  size="sm"
                  onClick={onReassign}
                  style={{
                    backgroundColor: "var(--bg-hover)",
                    color: "var(--text-primary)",
                  }}
                >
                  Reassign
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
