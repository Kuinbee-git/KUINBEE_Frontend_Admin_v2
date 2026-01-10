"use client";

import { useState, useRef } from "react";
import { FileText, ChevronDown, ChevronUp, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface DatasetFile {
  id: string;
  name: string;
  format: string;
  size: string;
  scope?: string;
  status?: string;
  uploadedAt?: string | null;
}

interface SchemaColumn {
  columnName: string;
  dataType: string;
  nullable: boolean;
}

interface DatasetFilesSchemaProps {
  files: DatasetFile[];
  schema: SchemaColumn[];
  sampleRows: Array<Record<string, string | number | boolean | null>>;
  onDownloadFile?: (fileId: string) => void;
  onUploadFile?: (file: File) => Promise<void>;
  isUploading?: boolean;
  canUpload?: boolean;
}

export function DatasetFilesSchema({
  files,
  schema,
  sampleRows,
  onDownloadFile,
  onUploadFile,
  isUploading = false,
  canUpload = false,
}: DatasetFilesSchemaProps) {
  const [showSchemaDetails, setShowSchemaDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="p-6 rounded-lg"
      style={{
        backgroundColor: "var(--bg-base)",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h2 className="mb-4" style={{ color: "var(--text-primary)" }}>Files & Schema</h2>

      <div className="space-y-4">
        {/* Files */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs" style={{ color: "var(--text-muted)" }}>
              Files ({files.length})
            </Label>
            {canUpload && onUploadFile && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".csv,.json,.xlsx,.xls,.parquet"
                />
                <Button
                  size="sm"
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  style={{
                    backgroundColor: "var(--brand-primary)",
                    color: "#ffffff",
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload File"}
                </Button>
              </>
            )}
          </div>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderWidth: "1px",
                  borderColor: "var(--border-default)",
                }}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {file.name}
                      </p>
                      {file.status && (
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: file.status === 'UPLOADED' ? 'var(--success-bg)' : 'var(--warning-bg)',
                            color: file.status === 'UPLOADED' ? 'var(--success-text)' : 'var(--warning-text)',
                          }}
                        >
                          {file.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {file.format} • {file.size}
                      {file.uploadedAt && ` • ${new Date(file.uploadedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                {onDownloadFile && (
                  <Button
                    size="sm"
                    onClick={() => onDownloadFile(file.id)}
                    style={{
                      backgroundColor: "var(--bg-hover)",
                      color: "var(--text-primary)",
                    }}
                  >
                    Download
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator style={{ backgroundColor: "var(--border-default)" }} />

        {/* Schema */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-xs" style={{ color: "var(--text-muted)" }}>
              Schema ({schema.length} columns)
            </Label>
            <button
              onClick={() => setShowSchemaDetails(!showSchemaDetails)}
              className="flex items-center gap-1 text-xs hover:underline"
              style={{ color: "var(--text-secondary)" }}
            >
              {showSchemaDetails ? "Hide details" : "Show details"}
              {showSchemaDetails ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>

          {showSchemaDetails && (
            <div className="rounded overflow-hidden" style={{ borderWidth: "1px", borderColor: "var(--border-default)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: "var(--bg-surface)" }}>
                    <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                      Column Name
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                      Data Type
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                      Nullable
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {schema.map((column, idx) => (
                    <tr
                      key={idx}
                      className="border-t"
                      style={{ borderColor: "var(--border-default)" }}
                    >
                      <td className="px-3 py-2 text-sm font-mono" style={{ color: "var(--text-primary)" }}>
                        {column.columnName}
                      </td>
                      <td className="px-3 py-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                        {column.dataType}
                      </td>
                      <td className="px-3 py-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                        {column.nullable ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sample Rows */}
          <div className="mt-4">
            <Label className="text-xs mb-2 block" style={{ color: "var(--text-muted)" }}>
              Sample Data (First {sampleRows.length} rows)
            </Label>
            <div className="rounded overflow-x-auto" style={{ borderWidth: "1px", borderColor: "var(--border-default)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: "var(--bg-surface)" }}>
                    {Object.keys(sampleRows[0] || {}).map((key) => (
                      <th key={key} className="text-left px-3 py-2 text-xs font-medium whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-t"
                      style={{ borderColor: "var(--border-default)" }}
                    >
                      {Object.values(row).map((value, vIdx) => (
                        <td key={vIdx} className="px-3 py-2 text-sm whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
