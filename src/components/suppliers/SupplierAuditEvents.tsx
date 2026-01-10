"use client";

import { useState } from "react";
import { History, ChevronDown, ChevronUp, User, FileText, Shield } from "lucide-react";

type AuditEventType =
  | "profile_created"
  | "profile_updated"
  | "kyc_submitted"
  | "kyc_approved"
  | "kyc_rejected"
  | "dataset_uploaded"
  | "dataset_approved"
  | "dataset_rejected"
  | "account_suspended"
  | "account_reactivated";

interface AuditEvent {
  id: string;
  timestamp: string;
  performedBy: string;
  eventType: AuditEventType;
  description: string;
  metadata?: Record<string, string | number | boolean | null>;
}

interface SupplierAuditEventsProps {
  auditEvents: AuditEvent[];
}

const getEventIcon = (eventType: AuditEventType) => {
  switch (eventType) {
    case "profile_created":
    case "profile_updated":
      return User;
    case "kyc_submitted":
    case "kyc_approved":
    case "kyc_rejected":
      return Shield;
    case "dataset_uploaded":
    case "dataset_approved":
    case "dataset_rejected":
      return FileText;
    default:
      return History;
  }
};

const getEventColor = (eventType: AuditEventType) => {
  if (
    eventType === "kyc_approved" ||
    eventType === "dataset_approved" ||
    eventType === "account_reactivated"
  ) {
    return "var(--status-success)";
  }
  if (
    eventType === "kyc_rejected" ||
    eventType === "dataset_rejected" ||
    eventType === "account_suspended"
  ) {
    return "var(--status-error)";
  }
  if (eventType === "kyc_submitted" || eventType === "dataset_uploaded") {
    return "var(--status-in-progress)";
  }
  return "var(--text-muted)";
};

export function SupplierAuditEvents({
  auditEvents,
}: SupplierAuditEventsProps) {
  const [showAuditEvents, setShowAuditEvents] = useState(false);

  return (
    <div
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      <button
        onClick={() => setShowAuditEvents(!showAuditEvents)}
        className="flex items-center justify-between w-full"
      >
        <h2
          className="flex items-center gap-2 text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          <History className="h-5 w-5" />
          Audit Events ({auditEvents.length})
        </h2>
        {showAuditEvents ? (
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

      {showAuditEvents && (
        <div className="mt-4 space-y-3">
          {auditEvents.length > 0 ? (
            auditEvents.map((event) => {
              const Icon = getEventIcon(event.eventType);
              const eventColor = getEventColor(event.eventType);

              return (
                <div
                  key={event.id}
                  className="p-4 rounded-lg border-l-4"
                  style={{
                    backgroundColor: "var(--bg-base)",
                    borderLeftColor: eventColor,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      className="h-5 w-5 mt-0.5 flex-shrink-0"
                      style={{ color: eventColor }}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {event.description}
                        </p>
                        <span
                          className="text-xs whitespace-nowrap ml-2"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {new Date(event.timestamp).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        by {event.performedBy}
                      </p>
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div
                          className="mt-2 p-2 rounded text-xs font-mono"
                          style={{
                            backgroundColor: "var(--bg-surface)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {Object.entries(event.metadata).map(([key, value]) => (
                            <div key={key}>
                              <span style={{ color: "var(--text-muted)" }}>
                                {key}:
                              </span>{" "}
                              {String(value)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              className="p-8 text-center rounded-lg"
              style={{
                backgroundColor: "var(--bg-base)",
                border: "1px solid var(--border-default)",
              }}
            >
              <History
                className="h-12 w-12 mx-auto mb-3"
                style={{ color: "var(--text-muted)" }}
              />
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                No audit events
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No activity recorded for this supplier yet
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
