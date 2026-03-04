"use client";

import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, File as FileIcon, X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUploadDatasetFile } from "@/hooks/api/useDatasets";
import type { UploadScope } from "@/types/dataset.types";

interface UploadDatasetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasetId: string;
  onUploadComplete?: () => void;
}

type UploadPhase = "idle" | "starting" | "uploading" | "completing" | "done" | "error";

const PHASE_LABELS: Record<UploadPhase, string> = {
  idle: "",
  starting: "Preparing upload…",
  uploading: "Uploading to storage…",
  completing: "Finalising…",
  done: "Upload complete!",
  error: "Upload failed",
};

export function UploadDatasetDialog({
  open,
  onOpenChange,
  datasetId,
  onUploadComplete,
}: UploadDatasetDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scope, setScope] = useState<UploadScope>("FINAL");
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadDatasetFile();

  const isUploading = phase !== "idle" && phase !== "done" && phase !== "error";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPhase("idle");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPhase("idle");
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const removeFile = () => {
    setSelectedFile(null);
    setPhase("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setPhase("uploading");

    try {
      await uploadMutation.mutateAsync({ datasetId, file: selectedFile, scope });
      setPhase("done");
      setTimeout(() => {
        onUploadComplete?.();
        resetAndClose();
      }, 1200);
    } catch {
      setPhase("error");
    }
  };

  const resetAndClose = () => {
    setSelectedFile(null);
    setScope("FINAL");
    setPhase("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onOpenChange(false);
  };

  const handleClose = () => {
    if (!isUploading) resetAndClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg font-semibold">Upload Dataset File</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Upload a file for this dataset. The file will be stored securely in cloud storage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 pb-4 space-y-5">
            {/* Upload Scope */}
            <div className="space-y-1.5">
              <Label htmlFor="upload-scope" className="text-sm font-medium">
                Upload Scope
              </Label>
              <Select
                value={scope}
                onValueChange={(value) => setScope(value as UploadScope)}
                disabled={isUploading}
              >
                <SelectTrigger id="upload-scope" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FINAL">Final Upload</SelectItem>
                  <SelectItem value="VERIFICATION">Verification Upload</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Final uploads can be published. Verification uploads are for review only.
              </p>
            </div>

            {/* File area */}
            {!selectedFile ? (
              <div
                role="button"
                tabIndex={0}
                aria-label="Click or drag a file to upload"
                className={cn(
                  "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer outline-none",
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/60 hover:bg-muted/40"
                )}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Drop a file here or{" "}
                    <span className="text-primary underline-offset-2 hover:underline">
                      click to browse
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    CSV, JSON, Excel, Parquet, or any data file
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  tabIndex={-1}
                />
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-background border flex-shrink-0">
                    <FileIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatFileSize(selectedFile.size)}
                      {selectedFile.type && ` · ${selectedFile.type}`}
                    </p>
                  </div>
                  {!isUploading && phase !== "done" && (
                    <button
                      type="button"
                      onClick={removeFile}
                      className="flex-shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Inline progress bar */}
                {isUploading && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{PHASE_LABELS[phase]}</span>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full animate-[progress_1.4s_ease-in-out_infinite]" />
                    </div>
                  </div>
                )}

                {/* Done state */}
                {phase === "done" && (
                  <div className="mt-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-medium">Upload complete!</span>
                  </div>
                )}

                {/* Error state */}
                {phase === "error" && (
                  <div className="mt-3 flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-medium">Upload failed — please try again.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t bg-muted/20 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="min-w-[80px]"
            >
              {phase === "done" ? "Close" : "Cancel"}
            </Button>
            {phase !== "done" && (
              <Button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="min-w-[100px]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
