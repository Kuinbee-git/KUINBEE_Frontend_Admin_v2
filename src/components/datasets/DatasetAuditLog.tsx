"use client";

import { useState } from "react";
import { History, ChevronDown, ChevronUp } from "lucide-react";
import { StatusBadge, getDatasetStatusSemantic, formatStatusLabel } from "@/components/shared/StatusBadge";

interface AuditEntry {
  id: string;
  timestamp: string;
  performedBy: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  notes?: string;
}

interface DatasetAuditLogProps {
  auditLog: AuditEntry[];
}

export function DatasetAuditLog({ auditLog }: DatasetAuditLogProps) {
  const [showAuditLog, setShowAuditLog] = useState(false);

  return (
    <div
      className="p-6 rounded-lg"
      style={{
        backgroundColor: "var(--bg-base)",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
      }}
    >
      <button
        onClick={() => setShowAuditLog(!showAuditLog)}
        className="flex items-center justify-between w-full"
      >
        <h2 className="flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <History className="w-5 h-5" />
          Audit Log ({auditLog.length})
        </h2>
        {showAuditLog ? (
          <ChevronUp className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
        ) : (
          <ChevronDown className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
        )}
      </button>

      {showAuditLog && (
        <div className="mt-4 space-y-3">
          {auditLog.map((entry) => (
            <div
              key={entry.id}
              className="p-4 rounded-lg border-l-4"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderLeftColor: "var(--border-default)",
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                    {entry.action}
                  </span>
                  <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>
                    by {entry.performedBy}
                  </span>
                </div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {new Date(entry.timestamp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {entry.previousStatus && entry.newStatus && (
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge
                    status={formatStatusLabel(entry.previousStatus)}
                    semanticType={getDatasetStatusSemantic(entry.previousStatus)}
                  />
                  <span style={{ color: "var(--text-muted)" }}>→</span>
                  <StatusBadge
                    status={formatStatusLabel(entry.newStatus)}
                    semanticType={getDatasetStatusSemantic(entry.newStatus)}
                  />
                </div>
              )}

              {entry.notes && (
                <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
                  {entry.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
