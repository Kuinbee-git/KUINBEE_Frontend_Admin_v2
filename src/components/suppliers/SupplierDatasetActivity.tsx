"use client";

import { useState } from "react";
import { Database, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  StatusBadge,
  getDatasetStatusSemantic,
  formatStatusLabel,
} from "@/components/shared/StatusBadge";

type DatasetStatus =
  | "pending_verification"
  | "under_review"
  | "changes_requested"
  | "published"
  | "rejected"
  | "approved"
  | "draft";

interface SupplierDataset {
  id: string;
  name: string;
  category: string;
  status: DatasetStatus;
  lastUpdated: string;
  createdDate: string;
}

interface SupplierDatasetActivityProps {
  datasets: SupplierDataset[];
}

export function SupplierDatasetActivity({
  datasets,
}: SupplierDatasetActivityProps) {
  const router = useRouter();
  const [showDatasets, setShowDatasets] = useState(true);

  return (
    <div
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      <button
        onClick={() => setShowDatasets(!showDatasets)}
        className="flex items-center justify-between w-full mb-4"
      >
        <h2
          className="flex items-center gap-2 text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          <Database className="h-5 w-5" />
          Dataset Activity ({datasets.length})
        </h2>
        {showDatasets ? (
          <ChevronUp
            className="h-5 w-5"
            style={{ color: "var(--text-muted)" }}
          />
        ) : (
          <ChevronDown
            className="h-5 w-5"
            style={{ color: "var(--text-muted)" }}
          />
        )}
      </button>

      {showDatasets && (
        <div>
          {datasets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className="border-b"
                    style={{
                      backgroundColor: "var(--bg-base)",
                      borderColor: "var(--border-default)",
                    }}
                  >
                    <th
                      className="text-left px-4 py-3 text-xs font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Dataset ID
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Name
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Category
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Status
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Last Updated
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((dataset) => (
                    <tr
                      key={dataset.id}
                      onClick={() =>
                        router.push(`/dashboard/datasets/${dataset.id}`)
                      }
                      className="border-b cursor-pointer transition-colors"
                      style={{
                        borderColor: "var(--border-default)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--bg-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <td
                        className="px-4 py-3 text-sm font-medium"
                        style={{ color: "var(--brand-primary)" }}
                      >
                        {dataset.id}
                      </td>
                      <td
                        className="px-4 py-3 text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {dataset.name}
                      </td>
                      <td
                        className="px-4 py-3 text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {dataset.category}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={formatStatusLabel(dataset.status)}
                          semanticType={getDatasetStatusSemantic(dataset.status)}
                        />
                      </td>
                      <td
                        className="px-4 py-3 text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {dataset.lastUpdated}
                      </td>
                      <td
                        className="px-4 py-3 text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {new Date(dataset.createdDate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className="p-8 text-center rounded-lg"
              style={{
                backgroundColor: "var(--bg-base)",
                border: "1px solid var(--border-default)",
              }}
            >
              <Database
                className="h-12 w-12 mx-auto mb-3"
                style={{ color: "var(--text-muted)" }}
              />
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                No datasets yet
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                This supplier hasn&apos;t uploaded any datasets
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
