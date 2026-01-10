"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Source } from "@/types";

interface SourceDialogsProps {
  dialogMode: "create" | "edit" | "verify" | "delete" | null;
  selectedSource: Source | null;
  sourceName: string;
  setSourceName: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (value: string) => void;
  deleteConfirmation: string;
  setDeleteConfirmation: (value: string) => void;
  onSave: () => void;
  onVerify: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function SourceDialogs({
  dialogMode,
  selectedSource,
  sourceName,
  setSourceName,
  description,
  setDescription,
  websiteUrl,
  setWebsiteUrl,
  deleteConfirmation,
  setDeleteConfirmation,
  onSave,
  onVerify,
  onDelete,
  onCancel,
}: SourceDialogsProps) {
  const canDelete =
    selectedSource && deleteConfirmation === selectedSource.name;

  return (
    <>
      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogMode === "create" || dialogMode === "edit"}
        onOpenChange={onCancel}
      >
        <DialogContent
          className="max-w-2xl"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-default)",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "var(--text-primary)" }}>
              {dialogMode === "create" ? "Create Source" : "Edit Source"}
            </DialogTitle>
            <DialogDescription style={{ color: "var(--text-muted)" }}>
              {dialogMode === "create"
                ? "Create a new dataset origin source."
                : "Update source information."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label
                htmlFor="source-name"
                className="text-xs mb-2 block"
                style={{ color: "var(--text-muted)" }}
              >
                Source Name{" "}
                <span style={{ color: "var(--status-error)" }}>*</span>
              </Label>
              <Input
                id="source-name"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="Enter source name..."
                style={{
                  backgroundColor: "var(--bg-base)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div>
              <Label
                htmlFor="description"
                className="text-xs mb-2 block"
                style={{ color: "var(--text-muted)" }}
              >
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter source description..."
                className="min-h-24"
                style={{
                  backgroundColor: "var(--bg-base)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div>
              <Label
                htmlFor="website-url"
                className="text-xs mb-2 block"
                style={{ color: "var(--text-muted)" }}
              >
                Website URL (Optional)
              </Label>
              <Input
                id="website-url"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
                style={{
                  backgroundColor: "var(--bg-base)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {dialogMode === "edit" && selectedSource && (
              <>
                <Separator
                  style={{ backgroundColor: "var(--border-default)" }}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label
                      className="text-xs mb-1 block"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Created By
                    </Label>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {selectedSource.createdBy}
                    </p>
                  </div>
                  <div>
                    <Label
                      className="text-xs mb-1 block"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Created By Type
                    </Label>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {selectedSource.createdByType.charAt(0).toUpperCase() +
                        selectedSource.createdByType.slice(1)}
                    </p>
                  </div>
                  <div>
                    <Label
                      className="text-xs mb-1 block"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Verification Status
                    </Label>
                    <StatusBadge
                      status={
                        selectedSource.isVerified ? "Verified" : "Unverified"
                      }
                      semanticType={
                        selectedSource.isVerified ? "success" : "neutral"
                      }
                    />
                  </div>
                  <div>
                    <Label
                      className="text-xs mb-1 block"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Created At
                    </Label>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {new Date(selectedSource.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={onCancel}
              style={{
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-primary)",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={!sourceName.trim()}
              style={
                !sourceName.trim()
                  ? {
                      backgroundColor: "var(--text-disabled)",
                      color: "#ffffff",
                      opacity: 0.5,
                      cursor: "not-allowed",
                    }
                  : {
                      backgroundColor: "var(--brand-primary)",
                      color: "#ffffff",
                    }
              }
            >
              {dialogMode === "create" ? "Create" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Confirmation Dialog */}
      <Dialog open={dialogMode === "verify"} onOpenChange={onCancel}>
        <DialogContent
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-default)",
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}
              >
                <CheckCircle2
                  className="w-5 h-5"
                  style={{ color: "var(--status-success)" }}
                />
              </div>
              <div>
                <DialogTitle style={{ color: "var(--text-primary)" }}>
                  Verify Source
                </DialogTitle>
                <DialogDescription style={{ color: "var(--text-muted)" }}>
                  Mark this source as verified
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              You are about to verify the source{" "}
              <strong>&quot;{selectedSource?.name}&quot;</strong>.
            </p>

            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: "rgba(56, 189, 248, 0.05)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                <strong>Note:</strong> Verification affects future dataset
                selection only. Existing datasets remain unchanged. This action
                will be logged in the audit trail.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={onCancel}
              style={{
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-primary)",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={onVerify}
              style={{
                backgroundColor: "var(--status-success)",
                color: "#ffffff",
              }}
            >
              Verify Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={dialogMode === "delete"} onOpenChange={onCancel}>
        <DialogContent
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-default)",
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
              >
                <AlertTriangle
                  className="w-5 h-5"
                  style={{ color: "var(--status-error)" }}
                />
              </div>
              <div>
                <DialogTitle style={{ color: "var(--text-primary)" }}>
                  Delete Source
                </DialogTitle>
                <DialogDescription style={{ color: "var(--text-muted)" }}>
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedSource && (selectedSource.datasetCount || 0) > 0 ? (
              <div
                className="p-4 rounded-lg border-l-4"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.05)",
                  borderColor: "var(--status-error)",
                }}
              >
                <p
                  className="text-sm font-medium mb-2"
                  style={{ color: "var(--status-error)" }}
                >
                  <strong>Warning:</strong> This source is used by{" "}
                  {selectedSource.datasetCount || 0} dataset
                  {(selectedSource.datasetCount || 0) !== 1 ? "s" : ""}.
                </p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Deleting this source will not remove it from existing
                  datasets. Strongly consider disabling instead of deletion to
                  preserve lineage.
                </p>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                You are about to delete the source{" "}
                <strong>&quot;{selectedSource?.name}&quot;</strong>.
              </p>
            )}

            <div>
              <Label
                htmlFor="delete-confirmation"
                className="text-xs mb-2 block"
                style={{ color: "var(--text-muted)" }}
              >
                Type the source name to confirm:{" "}
                <strong>{selectedSource?.name}</strong>
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type source name..."
                style={{
                  backgroundColor: "var(--bg-base)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={onCancel}
              style={{
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-primary)",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={onDelete}
              disabled={!canDelete}
              style={
                !canDelete
                  ? {
                      backgroundColor: "var(--text-disabled)",
                      color: "#ffffff",
                      opacity: 0.5,
                      cursor: "not-allowed",
                    }
                  : { backgroundColor: "var(--status-error)", color: "#ffffff" }
              }
            >
              Delete Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
