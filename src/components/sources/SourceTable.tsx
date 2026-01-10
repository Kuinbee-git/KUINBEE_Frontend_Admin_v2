"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable, ColumnDef, ActionButton } from "@/components/shared/DataTable";
import type { Source, SourceCreatedByType } from "@/types";

interface SourceTableProps {
  sources: Source[];
  onRowClick: (source: Source) => void;
  onVerifyClick: (source: Source, e: React.MouseEvent) => void;
  onDeleteClick: (source: Source, e: React.MouseEvent) => void;
  canUpdate: boolean;
}

export function SourceTable({
  sources,
  onRowClick,
  onVerifyClick,
  onDeleteClick,
  canUpdate,
}: SourceTableProps) {
  const columns: ColumnDef<Source>[] = [
    {
      header: "Source Name",
      accessor: (row) => ({ name: row.name, url: row.websiteUrl }),
      render: (data: { name: string; url: string | null }) => (
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
            {data.name}
          </span>
          {data.url && (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex"
            >
              <ExternalLink
                className="w-3.5 h-3.5 opacity-50 hover:opacity-100 transition-opacity"
                style={{ color: "var(--text-secondary)" }}
              />
            </a>
          )}
        </div>
      ),
    },
    {
      header: "Description",
      accessor: "description",
      render: (desc: string | null) =>
        desc ? (
          <p className="text-sm line-clamp-2" style={{ color: "var(--text-secondary)" }}>
            {desc}
          </p>
        ) : (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            —
          </span>
        ),
    },
    {
      header: "Created By Type",
      accessor: "createdByType",
      render: (type: SourceCreatedByType) => (
        <Badge
          style={
            type === "PLATFORM"
              ? {
                  backgroundColor: "rgba(56, 189, 248, 0.1)",
                  color: "#38bdf8",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                }
              : {
                  backgroundColor: "rgba(139, 92, 246, 0.1)",
                  color: "#a78bfa",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                }
          }
        >
          {type.charAt(0) + type.slice(1).toLowerCase()}
        </Badge>
      ),
    },
    {
      header: "Verification",
      accessor: "isVerified",
      render: (verified: boolean) => (
        <StatusBadge
          status={verified ? "Verified" : "Unverified"}
          semanticType={verified ? "success" : "neutral"}
        />
      ),
    },
    {
      header: "Datasets Count",
      accessor: "datasetCount",
      align: "center",
      render: (_: unknown, row: Source) => (
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {row.datasetCount || 0}
        </span>
      ),
    },
    {
      header: "Created At",
      accessor: "createdAt",
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

  const actions: ActionButton<Source>[] = canUpdate
    ? [
        {
          label: "Verify",
          onClick: onVerifyClick,
          variant: "success",
          show: (source) => !source.isVerified,
        },
        {
          label: "Delete",
          onClick: onDeleteClick,
          variant: "danger",
        },
      ]
    : [];

  return (
    <DataTable
      columns={columns}
      data={sources}
      onRowClick={onRowClick}
      actions={actions}
      getRowKey={(source) => source.id}
      emptyMessage="No sources found"
    />
  );
}
