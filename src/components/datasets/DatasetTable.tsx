"use client";

import { useState } from "react";
import { StatusBadge, getDatasetStatusSemantic, formatStatusLabel } from "@/components/shared/StatusBadge";
import { DataTable, ColumnDef } from "@/components/shared/DataTable";
import type { DatasetStatus, DatasetVisibility, OwnerType } from "@/types/dataset.types";
import { Globe, Lock, Link2, ChevronDown, Loader2 } from "lucide-react";

interface Dataset {
  id: string;
  datasetUniqueId: string;
  name: string;
  owner: OwnerType;
  category: string;
  source: string;
  status: DatasetStatus;
  visibility: DatasetVisibility;
  assignedTo: string | null;
  lastUpdated: string;
  createdDate: string;
}

interface DatasetTableProps {
  datasets: Dataset[];
  showOwnerColumn: boolean;
  onRowClick: (datasetId: string) => void;
  onVisibilityChange: (datasetId: string, visibility: DatasetVisibility) => void;
}

const VISIBILITY_OPTIONS: { value: DatasetVisibility; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  {
    value: "PUBLIC",
    label: "Public",
    icon: <Globe className="w-3 h-3" />,
    color: "var(--color-success, #16a34a)",
    bg: "rgba(22, 163, 74, 0.08)",
  },
  {
    value: "PRIVATE",
    label: "Private",
    icon: <Lock className="w-3 h-3" />,
    color: "var(--color-error, #dc2626)",
    bg: "rgba(220, 38, 38, 0.08)",
  },
  {
    value: "UNLISTED",
    label: "Unlisted",
    icon: <Link2 className="w-3 h-3" />,
    color: "var(--text-muted, #6b7280)",
    bg: "rgba(107, 114, 128, 0.08)",
  },
];

function VisibilityCell({
  datasetId,
  visibility,
  onVisibilityChange,
}: {
  datasetId: string;
  visibility: DatasetVisibility;
  onVisibilityChange: (datasetId: string, v: DatasetVisibility) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const current = VISIBILITY_OPTIONS.find((o) => o.value === visibility) ?? VISIBILITY_OPTIONS[0];

  const handleSelect = async (v: DatasetVisibility) => {
    if (v === visibility) { setOpen(false); return; }
    setPending(true);
    setOpen(false);
    try {
      await onVisibilityChange(datasetId, v);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ color: current.color, background: current.bg, borderColor: `${current.color}33` }}
      >
        {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : current.icon}
        {current.label}
        <ChevronDown className="w-2.5 h-2.5 opacity-60" />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 left-0 rounded-lg border shadow-lg overflow-hidden"
          style={{ minWidth: 130, backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
        >
          {VISIBILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:opacity-80 transition-opacity"
              style={{
                color: opt.color,
                backgroundColor: opt.value === visibility ? opt.bg : "transparent",
                fontWeight: opt.value === visibility ? 600 : 400,
              }}
            >
              {opt.icon}
              {opt.label}
              {opt.value === visibility && <span className="ml-auto text-[10px] opacity-60">current</span>}
            </button>
          ))}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}

export function DatasetTable({ datasets, showOwnerColumn, onRowClick, onVisibilityChange }: DatasetTableProps) {
  const baseColumns: ColumnDef<Dataset>[] = [
    {
      header: "Dataset ID",
      accessor: "datasetUniqueId",
      render: (datasetUniqueId: string) => (
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {datasetUniqueId}
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
  ];

  const ownerColumn: ColumnDef<Dataset> = {
    header: "Owner Type",
    accessor: "owner",
    render: (owner: OwnerType) => (
      <span className="text-sm" style={{ color: owner === "PLATFORM" ? "var(--brand-primary)" : "var(--text-primary)" }}>
        {owner === "PLATFORM" ? "Platform" : "Supplier"}
      </span>
    ),
  };

  const remainingColumns: ColumnDef<Dataset>[] = [
    {
      header: "Category",
      accessor: "category",
      render: (category: string) => <span className="text-sm">{category}</span>,
    },
    {
      header: "Source",
      accessor: "source",
      render: (source: string) => <span className="text-sm">{source}</span>,
    },
    {
      header: "Status",
      accessor: "status",
      render: (status: DatasetStatus) => (
        <StatusBadge
          status={formatStatusLabel(status)}
          semanticType={getDatasetStatusSemantic(status)}
        />
      ),
    },
    {
      header: "Visibility",
      accessor: "id",
      render: (_: string, row: Dataset) => (
        <VisibilityCell
          datasetId={row.id}
          visibility={row.visibility}
          onVisibilityChange={onVisibilityChange}
        />
      ),
    },
    {
      header: "Assigned To",
      accessor: "assignedTo",
      render: (assignedTo: string | null) =>
        assignedTo ? (
          <span className="text-sm">{assignedTo}</span>
        ) : (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Unassigned
          </span>
        ),
    },
    {
      header: "Last Updated",
      accessor: "lastUpdated",
      render: (date: string) => (
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {date}
        </span>
      ),
    },
  ];

  const columns = showOwnerColumn
    ? [...baseColumns, ownerColumn, ...remainingColumns]
    : [...baseColumns, ...remainingColumns];

  return (
    <DataTable
      columns={columns}
      data={datasets}
      onRowClick={(dataset) => onRowClick(dataset.id)}
      getRowKey={(dataset) => dataset.id}
      emptyMessage="No datasets found"
    />
  );
}
