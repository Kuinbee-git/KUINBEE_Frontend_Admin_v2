"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { getDatasets } from "@/services/datasets.service";
import type { DatasetListItem } from "@/types/dataset.types";

export default function AdminReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState<DatasetListItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getDatasets({ page: 1, pageSize: 100 });
        setDatasets(response.items || []);
      } catch (error) {
        console.error("Failed to fetch datasets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sorted = useMemo(
    () =>
      [...datasets].sort((a, b) => {
        if ((b.dataset.reviewCount || 0) !== (a.dataset.reviewCount || 0)) return (b.dataset.reviewCount || 0) - (a.dataset.reviewCount || 0);
        return Number(b.dataset.rating || 0) - Number(a.dataset.rating || 0);
      }),
    [datasets]
  );

  const columns: ColumnDef<DatasetListItem>[] = useMemo(
    () => [
      {
        header: "Dataset",
        render: (_, item) => (
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {item.dataset.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {item.dataset.datasetUniqueId}
            </p>
          </div>
        ),
      },
      {
        header: "Rating",
        render: (_, item) => {
          const ratingVal = Number(item.dataset.rating || 0);
          return ratingVal > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {ratingVal.toFixed(1)}
              </span>
            </div>
          ) : (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
          );
        },
      },
      {
        header: "Reviews",
        render: (_, item) => {
          const count = item.dataset.reviewCount || 0;
          return count > 0 ? (
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full inline-block"
              style={{
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-default)",
              }}
            >
              {count} review{count === 1 ? "" : "s"}
            </span>
          ) : (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>No reviews</span>
          );
        },
      },
      {
        header: "Status",
        align: "right",
        render: (_, item) => {
          const count = item.dataset.reviewCount || 0;
          const ratingVal = Number(item.dataset.rating || 0);
          if (count === 0) {
            return (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-muted)", border: "1px solid var(--border-default)" }}
              >
                Awaiting
              </span>
            );
          }
          let color = { bg: "var(--status-error)", text: "#fff" };
          let label = "Needs Improvement";
          if (ratingVal >= 4) {
             color = { bg: "var(--status-success)", text: "#fff" };
             label = "Excellent";
          } else if (ratingVal >= 3) {
             color = { bg: "var(--status-warning)", text: "#fff" };
             label = "Good";
          }
          return (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: color.bg, color: color.text }}
            >
              {label}
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="p-6">
      <h1 style={{ color: "var(--text-primary)" }} className="mb-2 text-2xl font-bold">
        Reviews
      </h1>
      <p style={{ color: "var(--text-muted)" }} className="mb-6">
        Marketplace dataset ratings and review volume overview.
      </p>

      <Card style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
        <CardHeader>
          <CardTitle>Dataset Ratings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <p style={{ color: "var(--text-muted)" }}>Loading ratings...</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className="p-6">
              <p style={{ color: "var(--text-muted)" }}>No marketplace datasets found.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-b-lg">
              <DataTable
                columns={columns}
                data={sorted}
                getRowKey={(row) => row.dataset.id}
                emptyMessage="No marketplace datasets found."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
