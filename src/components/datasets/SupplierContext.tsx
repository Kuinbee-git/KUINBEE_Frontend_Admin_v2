"use client";

import { Building2, Package, CheckCircle } from "lucide-react";

interface SupplierContextProps {
  supplier: {
    id: string;
    name: string;
    type: string;
    totalDatasets: number;
    approvedDatasets: number;
  };
  onSupplierClick: (supplierId: string) => void;
}

export function SupplierContext({ supplier, onSupplierClick }: SupplierContextProps) {
  return (
    <div
      className="p-6 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
      style={{
        backgroundColor: "var(--bg-base)",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
      }}
      onClick={() => onSupplierClick(supplier.id)}
    >
      <div className="flex items-start gap-4">
        <div
          className="p-3 rounded-lg"
          style={{
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <Building2 className="w-6 h-6" style={{ color: "var(--text-primary)" }} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            {supplier.name}
          </h3>
          <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
            {supplier.type}
          </p>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {supplier.totalDatasets} Total Datasets
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: "var(--state-success)" }} />
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {supplier.approvedDatasets} Approved
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
