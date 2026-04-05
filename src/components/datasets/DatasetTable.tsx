"use client";

import { StatusBadge, getDatasetStatusSemantic, formatStatusLabel } from "@/components/shared/StatusBadge";
import { DataTable, ColumnDef } from "@/components/shared/DataTable";
import type { DatasetListItem, DatasetStatus, DatasetVisibility } from "@/types/dataset.types";
import { VisibilityCell } from "./VisibilityCell";

interface DatasetTableProps {
  datasets: DatasetListItem[];
  showOwnerColumn: boolean;
  onRowClick: (datasetId: string) => void;
  onVisibilityChange: (datasetId: string, visibility: DatasetVisibility) => Promise<void>;
}

const getOwnerDisplayName = (row: DatasetListItem): string => {
  if (row.dataset.ownerType === "PLATFORM") return "Platform";

  const supplierProfile = row.owner?.supplierProfile;
  return (
    supplierProfile?.companyName
    ?? supplierProfile?.individualName
    ?? supplierProfile?.contactPersonName
    ?? row.owner?.email
    ?? "Supplier"
  );
};

export function DatasetTable({ datasets, showOwnerColumn, onRowClick, onVisibilityChange }: DatasetTableProps) {
  const baseColumns: ColumnDef<DatasetListItem>[] = [
    {
      header: "Dataset",
      accessor: "dataset",
      render: (_: DatasetListItem["dataset"], row: DatasetListItem) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {row.dataset.title}
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {row.dataset.datasetUniqueId}
          </span>
        </div>
      ),
    },
  ];

  const ownerColumn: ColumnDef<DatasetListItem> = {
    header: "Owner",
    accessor: "owner",
    render: (_: DatasetListItem["owner"], row: DatasetListItem) => (
      <div className="flex flex-col">
        <span className="text-sm" style={{ color: row.dataset.ownerType === "PLATFORM" ? "var(--brand-primary)" : "var(--text-primary)" }}>
          {getOwnerDisplayName(row)}
        </span>
        {row.dataset.ownerType === "SUPPLIER" && row.owner?.email && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {row.owner.email}
          </span>
        )}
      </div>
    ),
  };

  const remainingColumns: ColumnDef<DatasetListItem>[] = [
    {
      header: "Category",
      accessor: "primaryCategory",
      render: (_: DatasetListItem["primaryCategory"], row: DatasetListItem) => <span className="text-sm">{row.primaryCategory?.name ?? "N/A"}</span>,
    },
    {
      header: "Source",
      accessor: "source",
      render: (_: DatasetListItem["source"], row: DatasetListItem) => <span className="text-sm">{row.source?.name ?? "N/A"}</span>,
    },
    {
      header: "Status",
      accessor: "dataset",
      render: (_: DatasetListItem["dataset"], row: DatasetListItem) => (
        <StatusBadge
          status={formatStatusLabel(row.dataset.status as DatasetStatus)}
          semanticType={getDatasetStatusSemantic(row.dataset.status as DatasetStatus)}
        />
      ),
    },
    {
      header: "Visibility",
      accessor: "dataset",
      render: (_: DatasetListItem["dataset"], row: DatasetListItem) => (
        <VisibilityCell
          datasetId={row.dataset.id}
          visibility={row.dataset.visibility}
          onVisibilityChange={onVisibilityChange}
        />
      ),
    },
    {
      header: "Assigned To",
      accessor: "assignedAdmin",
      render: (_: DatasetListItem["assignedAdmin"], row: DatasetListItem) => {
        if (!row.assignedAdmin) {
          return (
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              Unassigned
            </span>
          );
        }

        return (
          <div className="flex flex-col">
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>
              {row.assignedAdmin.name ?? row.assignedAdmin.email}
            </span>
            {row.assignedAdmin.name && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {row.assignedAdmin.email}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Last Updated",
      accessor: "dataset",
      render: (_: DatasetListItem["dataset"], row: DatasetListItem) => (
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {new Date(row.dataset.updatedAt).toLocaleDateString()}
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
      onRowClick={(dataset) => onRowClick(dataset.dataset.id)}
      getRowKey={(dataset) => dataset.dataset.id}
      emptyMessage="No datasets found"
    />
  );
}
