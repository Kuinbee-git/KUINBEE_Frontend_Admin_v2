"use client";

import { Building2, FileText, ExternalLink } from "lucide-react";

interface SupplierBusinessContextProps {
  businessDomains: string[];
  natureOfData?: string;
  website?: string;
  description?: string;
}

export function SupplierBusinessContext({
  businessDomains,
  natureOfData,
  website,
  description,
}: SupplierBusinessContextProps) {
  return (
    <div
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      <h2
        className="text-lg font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        Business Context
      </h2>

      <div className="space-y-6">
        {/* Business Domains */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2
              className="h-4 w-4"
              style={{ color: "var(--text-muted)" }}
            />
            <h3
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Business Domains
            </h3>
          </div>
          {businessDomains.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {businessDomains.map((domain) => (
                <span
                  key={domain}
                  className="px-3 py-1.5 text-sm rounded-md"
                  style={{
                    backgroundColor: "var(--bg-base)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                >
                  {domain}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No business domains specified
            </p>
          )}
        </div>

        {/* Nature of Data */}
        {natureOfData && (
          <>
            <div
              className="h-px"
              style={{ backgroundColor: "var(--border-default)" }}
            />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText
                  className="h-4 w-4"
                  style={{ color: "var(--text-muted)" }}
                />
                <h3
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Nature of Data
                </h3>
              </div>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                {natureOfData}
              </p>
            </div>
          </>
        )}

        {/* Description */}
        {description && (
          <>
            <div
              className="h-px"
              style={{ backgroundColor: "var(--border-default)" }}
            />
            <div>
              <h3
                className="text-sm font-medium mb-3"
                style={{ color: "var(--text-secondary)" }}
              >
                Description
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-primary)" }}
              >
                {description}
              </p>
            </div>
          </>
        )}

        {/* Website */}
        {website && (
          <>
            <div
              className="h-px"
              style={{ backgroundColor: "var(--border-default)" }}
            />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ExternalLink
                  className="h-4 w-4"
                  style={{ color: "var(--text-muted)" }}
                />
                <h3
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Website
                </h3>
              </div>
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm inline-flex items-center gap-1 hover:underline"
                style={{ color: "var(--brand-primary)" }}
              >
                {website}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
