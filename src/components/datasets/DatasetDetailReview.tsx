"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DatasetHeader } from "./DatasetHeader";
import { DatasetMetadata } from "./DatasetMetadata";
import { DatasetFilesSchema } from "./DatasetFilesSchema";
import { SupplierContext } from "./SupplierContext";
import { ReviewActions } from "./ReviewActions";
import { ConversationTimeline } from "./ConversationTimeline";
import { DatasetAuditLog } from "./DatasetAuditLog";
import { EditMetadataDialog } from "./EditMetadataDialog";
import { useProposalReview, useUpdateDatasetMetadata, usePublishDataset, useUnpublishDataset, useUploadDatasetFile, useDatasetUploads, usePickProposal, useApproveProposal, useRejectProposal, useRequestChanges } from "@/hooks/api/useDatasets";
import { useMyPermissions } from "@/hooks/api/useAuth";
import { getUploadDownloadUrl } from "@/services/datasets.service";
import { toast } from "sonner";
import type { UpdateDatasetMetadataRequest } from "@/types/dataset.types";

interface DatasetDetailReviewProps {
  datasetId: string;
}

export function DatasetDetailReview({ datasetId }: DatasetDetailReviewProps) {
  const router = useRouter();
  
  // Fetch dataset proposal review details
  const { data: datasetData, isLoading } = useProposalReview(datasetId);
  
  // Note: Upload history can be fetched separately if needed
  // const { data: uploadsData } = useDatasetUploads(datasetId, { pageSize: 10 });
  
  // Mutations
  const updateMetadataMutation = useUpdateDatasetMetadata();
  const publishMutation = usePublishDataset();
  const unpublishMutation = useUnpublishDataset();
  const uploadMutation = useUploadDatasetFile();
  
  // Proposal mutations
  const pickProposalMutation = usePickProposal();
  const approveProposalMutation = useApproveProposal();
  const rejectProposalMutation = useRejectProposal();
  const requestChangesMutation = useRequestChanges();
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  
  // Edit metadata modal state
  const [isEditMetadataOpen, setIsEditMetadataOpen] = useState(false);
  
  // Permissions
  const { data: permissionsData } = useMyPermissions();
  
  const canApprove = permissionsData?.includes('datasets:approve') ?? false;
  const canReject = permissionsData?.includes('datasets:reject') ?? false;
  const canRequestChanges = permissionsData?.includes('datasets:request_changes') ?? false;
  const canEdit = permissionsData?.includes('datasets:update') ?? false;
  
  const handleBack = useCallback(() => {
    router.push("/dashboard/datasets");
  }, [router]);

  const handleReassign = useCallback(() => {
    console.log("Reassign reviewer - Not implemented yet");
    // TODO: Implement reassignment
  }, []);

  const handleEditMetadata = useCallback(() => {
    setIsEditMetadataOpen(true);
  }, []);

  const handleSaveMetadata = useCallback(async (data: UpdateDatasetMetadataRequest) => {
    try {
      await updateMetadataMutation.mutateAsync({
        datasetId,
        data,
      });
      toast.success("Metadata updated successfully");
    } catch (error) {
      toast.error("Failed to update metadata");
      throw error;
    }
  }, [datasetId, updateMetadataMutation]);

  const handleUploadFile = useCallback(async (file: File) => {
    if (!datasetId) return;
    
    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync({
        datasetId,
        file,
        scope: 'FINAL'
      });
      toast.success('File uploaded successfully');
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, [datasetId, uploadMutation]);
  
  const handleDownloadFile = useCallback(async (fileId: string) => {
    try {
      const response = await getUploadDownloadUrl(datasetId, fileId);
      // Open download URL in new tab
      window.open(response.url, '_blank');
      toast.success('Download started');
    } catch {
      toast.error('Failed to get download URL');
    }
  }, [datasetId]);

  const handleSupplierClick = useCallback((supplierId: string) => {
    router.push(`/dashboard/suppliers/${supplierId}`);
  }, [router]);

  const handleActionConfirm = useCallback((action: "approve" | "reject" | "request_changes" | "publish" | "unpublish" | "pick", notes: string) => {
    console.log("Action confirmed:", action, "Notes:", notes);
    
    if (action === "publish" && datasetData?.verification?.currentUpload) {
      publishMutation.mutate({
        datasetId,
        data: { uploadId: datasetData.verification.currentUpload.id }
      });
    } else if (action === "unpublish") {
      unpublishMutation.mutate(datasetId);
    } else if (action === "pick") {
      pickProposalMutation.mutate(datasetId);
    } else if (action === "approve") {
      approveProposalMutation.mutate({
        datasetId,
        data: notes ? { notes } : undefined
      });
    } else if (action === "reject") {
      rejectProposalMutation.mutate({
        datasetId,
        data: {
          rejectionReason: notes || "Rejected",
          notes: notes || undefined
        }
      });
    } else if (action === "request_changes") {
      requestChangesMutation.mutate({
        datasetId,
        data: { notes }
      });
    }
  }, [datasetId, datasetData, publishMutation, unpublishMutation, pickProposalMutation, approveProposalMutation, rejectProposalMutation, requestChangesMutation]);

  const handleAddNote = useCallback((note: string) => {
    console.log("Adding note:", note);
    // TODO: Implement conversation/notes API
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-surface)" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading dataset...</p>
      </div>
    );
  }
  
  if (!datasetData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-surface)" }}>
        <div className="text-center">
          <p className="text-lg font-medium mb-2 text-red-500">Failed to load dataset</p>
          <button 
            onClick={handleBack}
            className="text-sm underline"
            style={{ color: "var(--text-muted)" }}
          >
            Back to datasets
          </button>
        </div>
      </div>
    );
  }
  
  const { dataset, verification, activeAssignment, primaryCategory, source, aboutDatasetInfo, dataFormatInfo, features } = datasetData;
  
  // Transform status, ownerType, and visibility for UI compatibility
  const currentStatus = dataset.status as string; // UI component expects status as string
  const ownerType = dataset.ownerType.toLowerCase() as "platform" | "supplier";
  const visibility = dataset.visibility.toLowerCase() as "public" | "private" | "restricted";
  
  // Transform current upload for UI
  const files = verification?.currentUpload ? [{
    id: verification.currentUpload.id,
    name: verification.currentUpload.originalFileName || 'Unknown file',
    format: verification.currentUpload.contentType || dataFormatInfo?.fileFormat || 'Unknown',
    size: verification.currentUpload.sizeBytes ? `${(parseInt(verification.currentUpload.sizeBytes) / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
    scope: verification.currentUpload.scope,
    status: verification.currentUpload.status,
    uploadedAt: verification.currentUpload.uploadedAt
  }] : [];
  
  const mockConversation: Array<{
    id: string;
    author: string;
    authorType: "platform" | "supplier";
    timestamp: string;
    content: string;
    relatedStatus?: string;
  }> = [];
  
  const mockAuditLog: Array<{
    id: string;
    timestamp: string;
    performedBy: string;
    action: string;
    previousStatus?: string;
    newStatus?: string;
    notes?: string;
  }> = [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-surface)" }}>
      {/* Header */}
      <DatasetHeader
        datasetId={dataset.datasetUniqueId}
        datasetName={dataset.title}
        ownerType={ownerType}
        currentStatus={currentStatus}
        lastUpdated={new Date(dataset.updatedAt).toLocaleString()}
        assignedReviewer={activeAssignment ? {
          id: activeAssignment.adminId,
          name: 'Reviewer' // TODO: Fetch admin name
        } : undefined}
        canReassign={false} // TODO: Check permissions
        onBack={handleBack}
        onReassign={handleReassign}
      />

      {/* Content Grid */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (Left Column) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata */}
          <DatasetMetadata
            description={aboutDatasetInfo?.overview || aboutDatasetInfo?.description || "No description available"}
            category={primaryCategory.name}
            source={source.name}
            superType={dataset.superType}
            visibility={visibility}
            fileFormats={dataFormatInfo?.fileFormat ? [dataFormatInfo.fileFormat] : []}
            canEdit={canEdit}
            onEdit={handleEditMetadata}
          />

          {/* Files & Schema */}
          <DatasetFilesSchema
            files={files}
            schema={features.map(f => ({
              columnName: f.name,
              dataType: f.dataType,
              nullable: f.isNullable
            }))}
            sampleRows={[]} // TODO: Fetch sample data
            onDownloadFile={handleDownloadFile}
            onUploadFile={handleUploadFile}
            isUploading={isUploading}
            canUpload={canEdit}
          />

          {/* Conversation */}
          <ConversationTimeline
            conversation={mockConversation}
            onAddNote={handleAddNote}
          />

          {/* Audit Log */}
          <DatasetAuditLog
            auditLog={mockAuditLog}
          />
        </div>

        {/* Sidebar (Right Column) */}
        <div className="space-y-6">
          {/* Supplier Context (if supplier-owned) */}
          {dataset.ownerType === "SUPPLIER" && (
            <SupplierContext
              supplier={{
                id: dataset.ownerId,
                name: "Supplier Name", // TODO: Fetch supplier details
                type: "company",
                totalDatasets: 0,
                approvedDatasets: 0,
              }}
              onSupplierClick={handleSupplierClick}
            />
          )}

          {/* Review Actions */}
          <ReviewActions
            currentStatus={currentStatus}
            ownerType={ownerType}
            canApprove={canApprove}
            canReject={canReject}
            canRequestChanges={canRequestChanges}
            onActionConfirm={handleActionConfirm}
          />
        </div>
      </div>

      {/* Edit Metadata Dialog */}
      <EditMetadataDialog
        open={isEditMetadataOpen}
        onOpenChange={setIsEditMetadataOpen}
        onSave={handleSaveMetadata}
        initialData={{
          aboutDatasetInfo: aboutDatasetInfo || undefined,
          dataFormatInfo: dataFormatInfo || undefined,
        }}
      />
    </div>
  );
}
