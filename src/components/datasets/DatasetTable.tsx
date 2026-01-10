"use client";

import { StatusBadge, getDatasetStatusSemantic, formatStatusLabel } from "@/components/shared/StatusBadge";
import { DataTable, ColumnDef } from "@/components/shared/DataTable";
import type { DatasetStatus, OwnerType } from "@/types/dataset.types";

interface Dataset {
  id: string;
  name: string;
  owner: OwnerType;
  supplier: string | null;
  category: string;
  source: string;
  status: DatasetStatus;
  assignedTo: string | null;
  lastUpdated: string;
  createdDate: string;
}

interface DatasetTableProps {
  datasets: Dataset[];
  showSupplierColumn: boolean;
  onRowClick: (datasetId: string) => void;
}

export function DatasetTable({ datasets, showSupplierColumn, onRowClick }: DatasetTableProps) {
  const baseColumns: ColumnDef<Dataset>[] = [
    {
      header: "Dataset ID",
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
  ];

  const supplierColumn: ColumnDef<Dataset> = {
    header: "Supplier",
    accessor: "supplier",
    render: (supplier: string | null) =>
      supplier ? (
        <span className="text-sm">{supplier}</span>
      ) : (
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          Platform
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

  const columns = showSupplierColumn
    ? [...baseColumns, supplierColumn, ...remainingColumns]
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
