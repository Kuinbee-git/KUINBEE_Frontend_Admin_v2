"use client";

import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface DatasetMetadataProps {
  description: string;
  category: string;
  source: string;
  superType: string;
  visibility: "public" | "private" | "restricted";
  fileFormats: string[];
  canEdit: boolean;
  onEdit?: () => void;
}

export function DatasetMetadata({
  description,
  category,
  source,
  superType,
  visibility,
  fileFormats,
  canEdit,
  onEdit,
}: DatasetMetadataProps) {
  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return <Eye className="w-4 h-4" />;
      case "private":
        return <EyeOff className="w-4 h-4" />;
      case "restricted":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div
      className="p-6 rounded-lg"
      style={{
        backgroundColor: "var(--bg-base)",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ color: "var(--text-primary)" }}>Dataset Information</h2>
        {canEdit && onEdit && (
          <Button
            size="sm"
            onClick={onEdit}
            style={{
              backgroundColor: "var(--bg-hover)",
              color: "var(--text-primary)",
            }}
          >
            Edit Metadata
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
            Description
          </Label>
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>
            {description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
              Category
            </Label>
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>
              {category}
            </p>
          </div>
          <div>
            <Label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
              Source
            </Label>
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>
              {source}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
              Super Type
            </Label>
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>
              {superType}
            </p>
          </div>
          <div>
            <Label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
              Visibility
            </Label>
            <div className="flex items-center gap-2">
              {getVisibilityIcon(visibility)}
              <span className="text-sm capitalize" style={{ color: "var(--text-primary)" }}>
                {visibility}
              </span>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
            File Formats
          </Label>
          <div className="flex gap-2">
            {fileFormats.map((format) => (
              <Badge
                key={format}
                variant="outline"
                className="text-xs"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border-default)",
                }}
              >
                {format}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
