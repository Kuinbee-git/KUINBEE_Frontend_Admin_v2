"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  Upload,
  Download,
  Pencil,
  X,
  Check,
  Loader2,
  MapPin,
  FileText,
  Tag,
  Database,
  BarChart3,
  DollarSign,
  Info,
  Copy,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, getDatasetStatusSemantic } from "@/components/shared/StatusBadge";
import { DatasetKdtsView } from "./DatasetKdtsView";
import { DatasetAuditLog } from "./DatasetAuditLog";
import { UploadDatasetDialog } from "./UploadDatasetDialog";
import {
  useDataset,
  useDatasetUploads,
  useUpdateDataset,
  useUpdateDatasetMetadata,
  useDeleteDataset,
  usePublishDataset,
  useUnpublishDataset,
  useDownloadUploadUrl,
} from "@/hooks/api/useDatasets";
import { useCategories } from "@/hooks/api/useCategories";
import { useSources } from "@/hooks/api/useSources";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  UpdateDatasetRequest,
  UpdateDatasetMetadataRequest,
  DatasetVisibility,
  Currency,
  UploadScope,
  UploadStatus,
} from "@/types";

// ============================================
// Constants
// ============================================

const SUPER_TYPE_OPTIONS = [
  { value: "CROSS_SECTIONAL", label: "Cross-Sectional" },
  { value: "TIME_SERIES", label: "Time Series" },
  { value: "PANEL", label: "Panel" },
  { value: "POOLED_CROSS_SECTIONAL", label: "Pooled Cross-Sectional" },
  { value: "REPEATED_CROSS_SECTIONS", label: "Repeated Cross-Sections" },
  { value: "SPATIAL", label: "Spatial" },
  { value: "SPATIO_TEMPORAL", label: "Spatio-Temporal" },
  { value: "EXPERIMENTAL", label: "Experimental" },
  { value: "OBSERVATIONAL", label: "Observational" },
  { value: "BIG_DATA", label: "Big Data" },
  { value: "EVENT_HISTORY_SURVIVAL", label: "Event History / Survival" },
  { value: "HIERARCHICAL_MULTILEVEL", label: "Hierarchical / Multilevel" },
];

function getSuperTypeLabel(value: string) {
  return SUPER_TYPE_OPTIONS.find((o) => o.value === value)?.label || value.replace(/_/g, " ");
}

// ============================================
// Helpers
// ============================================

function formatDate(date: string | null) {
  if (!date) return "\u2014";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(date: string | null) {
  if (!date) return "\u2014";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatFileSize(bytes: string | null) {
  if (!bytes) return "\u2014";
  const num = parseInt(bytes, 10);
  if (isNaN(num)) return bytes;
  if (num < 1024) return num + " B";
  if (num < 1024 * 1024) return (num / 1024).toFixed(1) + " KB";
  if (num < 1024 * 1024 * 1024) return (num / (1024 * 1024)).toFixed(2) + " MB";
  return (num / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
}

// ============================================
// Sub-Components
// ============================================

function SectionCard({
  title,
  icon: Icon,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  isSaving,
  children,
  editContent,
  badge,
}: {
  title: string;
  icon: React.ElementType;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  children: React.ReactNode;
  editContent: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border transition-colors"
      style={{
        backgroundColor: "var(--bg-base)",
        borderColor: isEditing ? "var(--brand-primary)" : "var(--border-default)",
      }}
    >
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-[18px] h-[18px]" style={{ color: "var(--text-muted)" }} />
          <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h3>
          {badge}
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving} className="h-8 px-3 text-xs">
              <X className="w-3.5 h-3.5 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="h-8 px-3 text-xs"
              style={{ backgroundColor: "var(--brand-primary)", color: "#fff" }}
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 px-3 text-xs" style={{ color: "var(--text-muted)" }}>
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>
        )}
      </div>
      <div className="px-6 py-5">{isEditing ? editContent : children}</div>
    </div>
  );
}

function InfoField({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
      <div className="text-sm" style={{ color: "var(--text-primary)" }}>{value || "\u2014"}</div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

interface PlatformDatasetDetailProps {
  datasetId: string;
}

export function PlatformDatasetDetail({ datasetId }: PlatformDatasetDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Upload filters
  const [uploadScopeFilter, setUploadScopeFilter] = useState<UploadScope | "ALL">("ALL");
  const [uploadStatusFilter, setUploadStatusFilter] = useState<UploadStatus | "ALL">("ALL");
  const [downloadingUploadId, setDownloadingUploadId] = useState<string | null>(null);

  // Inline editing
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch data
  const { data: datasetData, isLoading, refetch } = useDataset(datasetId);
  const { data: uploadsData, refetch: refetchUploads } = useDatasetUploads(datasetId, {
    scope: uploadScopeFilter === "ALL" ? undefined : uploadScopeFilter,
    status: uploadStatusFilter === "ALL" ? undefined : uploadStatusFilter,
  });
  const { data: categoriesData } = useCategories();
  const { data: sourcesData } = useSources();

  // Mutations
  const updateDatasetMutation = useUpdateDataset();
  const updateMetadataMutation = useUpdateDatasetMetadata();
  const deleteDatasetMutation = useDeleteDataset();
  const publishDatasetMutation = usePublishDataset();
  const unpublishDatasetMutation = useUnpublishDataset();
  const downloadUrlMutation = useDownloadUploadUrl();

  // ---- Basic Info edit state ----
  const [editTitle, setEditTitle] = useState("");
  const [editVisibility, setEditVisibility] = useState<DatasetVisibility>("PUBLIC");
  const [editSuperType, setEditSuperType] = useState("CROSS_SECTIONAL");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editSourceId, setEditSourceId] = useState("");
  const [editLicense, setEditLicense] = useState("");
  const [editIsPaid, setEditIsPaid] = useState(false);
  const [editPrice, setEditPrice] = useState("");
  const [editCurrency, setEditCurrency] = useState<Currency>("INR");

  // ---- About Dataset edit state ----
  const [editOverview, setEditOverview] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDataQuality, setEditDataQuality] = useState("");
  const [editUseCases, setEditUseCases] = useState("");
  const [editLimitations, setEditLimitations] = useState("");
  const [editMethodology, setEditMethodology] = useState("");

  // ---- Location edit state ----
  const [editCountry, setEditCountry] = useState("");
  const [editState, setEditState] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [editCoordinates, setEditCoordinates] = useState("");
  const [editCoverage, setEditCoverage] = useState("");

  // ---- Data Format edit state ----
  const [editFileFormat, setEditFileFormat] = useState("");
  const [editRows, setEditRows] = useState("");
  const [editCols, setEditCols] = useState("");
  const [editFileSize, setEditFileSize] = useState("");
  const [editCompression, setEditCompression] = useState("");
  const [editEncoding, setEditEncoding] = useState("");

  // ---- Tags edit state ----
  const [editTags, setEditTags] = useState("");

  const categories = categoriesData?.items || [];
  const sources = sourcesData?.items || [];

  // ============================================
  // Populate edit forms on click
  // ============================================

  const startEditBasicInfo = useCallback(() => {
    if (!datasetData?.dataset) return;
    const d = datasetData.dataset;
    setEditTitle(d.title);
    setEditVisibility(d.visibility);
    setEditSuperType(d.superType);
    setEditCategoryId(d.primaryCategoryId);
    setEditSourceId(d.sourceId);
    setEditLicense(d.license);
    setEditIsPaid(d.isPaid);
    setEditPrice(d.price || "");
    setEditCurrency(d.currency);
    setEditingSection("basicInfo");
  }, [datasetData]);

  const startEditAbout = useCallback(() => {
    const a = datasetData?.aboutDatasetInfo;
    setEditOverview(a?.overview || "");
    setEditDescription(a?.description || "");
    setEditDataQuality(a?.dataQuality || "");
    setEditUseCases(a?.useCases || "");
    setEditLimitations(a?.limitations || "");
    setEditMethodology(a?.methodology || "");
    setEditingSection("aboutDataset");
  }, [datasetData]);

  const startEditLocation = useCallback(() => {
    const l = datasetData?.locationInfo;
    setEditCountry(l?.country || "");
    setEditState(l?.state || "");
    setEditCity(l?.city || "");
    setEditRegion(l?.region || "");
    setEditCoordinates(l?.coordinates || "");
    setEditCoverage(l?.coverage || "");
    setEditingSection("location");
  }, [datasetData]);

  const startEditDataFormat = useCallback(() => {
    const f = datasetData?.dataFormatInfo;
    setEditFileFormat(f?.fileFormat || "");
    setEditRows(f?.rows?.toString() || "");
    setEditCols(f?.cols?.toString() || "");
    setEditFileSize(f?.fileSize || "");
    setEditCompression(f?.compressionType || "");
    setEditEncoding(f?.encoding || "");
    setEditingSection("dataFormat");
  }, [datasetData]);

  const startEditTags = useCallback(() => {
    const t = datasetData?.tags || [];
    setEditTags(t.map((tag) => tag.name).join(", "));
    setEditingSection("tags");
  }, [datasetData]);

  // ============================================
  // Save handlers
  // ============================================

  const saveBasicInfo = useCallback(async () => {
    setIsSaving(true);
    try {
      const data: UpdateDatasetRequest = {
        title: editTitle,
        visibility: editVisibility,
        superType: editSuperType,
        primaryCategoryId: editCategoryId,
        sourceId: editSourceId,
        license: editLicense,
        isPaid: editIsPaid,
        price: editIsPaid ? editPrice : null,
        currency: editCurrency,
      };
      await updateDatasetMutation.mutateAsync({ datasetId, data });
      setEditingSection(null);
      refetch();
    } catch {
      // handled by mutation
    } finally {
      setIsSaving(false);
    }
  }, [datasetId, editTitle, editVisibility, editSuperType, editCategoryId, editSourceId, editLicense, editIsPaid, editPrice, editCurrency, updateDatasetMutation, refetch]);

  const saveAboutDataset = useCallback(async () => {
    setIsSaving(true);
    try {
      const data: UpdateDatasetMetadataRequest = {
        aboutDatasetInfo: {
          overview: editOverview,
          description: editDescription,
          dataQuality: editDataQuality,
          useCases: editUseCases || null,
          limitations: editLimitations || null,
          methodology: editMethodology || null,
        },
      };
      await updateMetadataMutation.mutateAsync({ datasetId, data });
      setEditingSection(null);
      refetch();
    } catch {
      // handled by mutation
    } finally {
      setIsSaving(false);
    }
  }, [datasetId, editOverview, editDescription, editDataQuality, editUseCases, editLimitations, editMethodology, updateMetadataMutation, refetch]);

  const saveLocation = useCallback(async () => {
    setIsSaving(true);
    try {
      const data: UpdateDatasetMetadataRequest = {
        locationInfo: {
          country: editCountry,
          state: editState || null,
          city: editCity || null,
          region: editRegion || null,
          coordinates: editCoordinates || null,
          coverage: editCoverage || null,
        },
      };
      await updateMetadataMutation.mutateAsync({ datasetId, data });
      setEditingSection(null);
      refetch();
    } catch {
      // handled by mutation
    } finally {
      setIsSaving(false);
    }
  }, [datasetId, editCountry, editState, editCity, editRegion, editCoordinates, editCoverage, updateMetadataMutation, refetch]);

  const saveDataFormat = useCallback(async () => {
    setIsSaving(true);
    try {
      const data: UpdateDatasetMetadataRequest = {
        dataFormatInfo: {
          fileFormat: editFileFormat || undefined,
          rows: editRows ? parseInt(editRows) : undefined,
          cols: editCols ? parseInt(editCols) : undefined,
          fileSize: editFileSize || undefined,
          compressionType: editCompression || undefined,
          encoding: editEncoding || undefined,
        },
      };
      await updateMetadataMutation.mutateAsync({ datasetId, data });
      setEditingSection(null);
      refetch();
    } catch {
      // handled by mutation
    } finally {
      setIsSaving(false);
    }
  }, [datasetId, editFileFormat, editRows, editCols, editFileSize, editCompression, editEncoding, updateMetadataMutation, refetch]);

  const saveTags = useCallback(async () => {
    setIsSaving(true);
    try {
      const data: UpdateDatasetMetadataRequest = {
        tags: editTags ? editTags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };
      await updateMetadataMutation.mutateAsync({ datasetId, data });
      setEditingSection(null);
      refetch();
    } catch {
      // handled by mutation
    } finally {
      setIsSaving(false);
    }
  }, [datasetId, editTags, updateMetadataMutation, refetch]);

  // ============================================
  // Action handlers
  // ============================================

  const handleBack = useCallback(() => {
    router.push("/dashboard/datasets");
  }, [router]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteDatasetMutation.mutateAsync(datasetId);
      router.push("/dashboard/datasets");
    } catch {
      // handled
    }
  }, [datasetId, deleteDatasetMutation, router]);

  const handleDownloadUpload = useCallback(async (uploadId: string) => {
    setDownloadingUploadId(uploadId);
    try {
      const result = await downloadUrlMutation.mutateAsync({ datasetId, uploadId });
      // Open the presigned download URL in a new tab
      window.open(result.url, "_blank");
    } catch {
      // error toast handled by mutation
    } finally {
      setDownloadingUploadId(null);
    }
  }, [datasetId, downloadUrlMutation]);

  const handlePublish = useCallback(async () => {
    const allUploads = uploadsData?.items || [];
    const latestUpload = allUploads.find((u) => u.status === "UPLOADED") || datasetData?.publishedUpload;
    if (!latestUpload?.id) {
      toast.error("No upload available to publish. Upload a file first.");
      return;
    }
    try {
      await publishDatasetMutation.mutateAsync({ datasetId, data: { uploadId: latestUpload.id } });
      setPublishDialogOpen(false);
      refetch();
    } catch {
      // handled
    }
  }, [datasetId, uploadsData, datasetData, publishDatasetMutation, refetch]);

  const handleUnpublish = useCallback(async () => {
    try {
      await unpublishDatasetMutation.mutateAsync(datasetId);
      setUnpublishDialogOpen(false);
      refetch();
    } catch {
      // handled
    }
  }, [datasetId, unpublishDatasetMutation, refetch]);

  // ============================================
  // Loading & error
  // ============================================

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-surface)" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--brand-primary)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading dataset...</p>
        </div>
      </div>
    );
  }

  if (!datasetData || !datasetData.dataset) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-surface)" }}>
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 mx-auto" style={{ color: "var(--state-error)" }} />
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>Dataset not found</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            The dataset you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button variant="outline" onClick={handleBack} className="mt-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Datasets
          </Button>
        </div>
      </div>
    );
  }

  const { dataset, primaryCategory, source, aboutDatasetInfo, locationInfo, dataFormatInfo, features, tags, publishedUpload } = datasetData;
  const isPublished = dataset?.status === "PUBLISHED";
  const uploads = uploadsData?.items || [];

  const mockAuditLog = [
    {
      id: "1",
      timestamp: dataset?.createdAt || new Date().toISOString(),
      performedBy: "System",
      action: "Created",
      newStatus: dataset?.status,
      notes: "Platform dataset created",
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-surface)" }}>
      {/* ============ HEADER ============ */}
      <div
        className="border-b sticky top-0 z-10"
        style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
      >
        <div className="px-6 py-4 max-w-[1200px] mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Button variant="ghost" size="icon" onClick={handleBack} className="mt-0.5 flex-shrink-0 h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
                    {dataset.title}
                  </h1>
                  <StatusBadge status={dataset.status} semanticType={getDatasetStatusSemantic(dataset.status)} />
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    {dataset.visibility === "PUBLIC" ? <Eye className="w-3 h-3" /> : dataset.visibility === "PRIVATE" ? <EyeOff className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {dataset.visibility}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs flex-wrap" style={{ color: "var(--text-muted)" }}>
                  <button
                    onClick={() => copyToClipboard(dataset.datasetUniqueId)}
                    className="flex items-center gap-1 hover:opacity-80 transition-opacity font-mono"
                    title="Click to copy"
                  >
                    {dataset.datasetUniqueId}
                    <Copy className="w-3 h-3" />
                  </button>
                  <span>&middot;</span>
                  <span>{primaryCategory?.name}</span>
                  <span>&middot;</span>
                  <span>{source?.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isPublished ? (
                <Button variant="outline" size="sm" onClick={() => setUnpublishDialogOpen(true)} className="h-8 text-xs">
                  <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                  Unpublish
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setPublishDialogOpen(true)}
                  className="h-8 text-xs"
                  style={{ backgroundColor: "var(--brand-primary)", color: "#fff" }}
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Publish
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ============ CONTENT ============ */}
      <div className="px-6 py-6 max-w-[1200px] mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="uploads">Uploads</TabsTrigger>
            <TabsTrigger value="kdts">KDTS</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          {/* ================ OVERVIEW TAB ================ */}
          <TabsContent value="overview" className="space-y-5 mt-0">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Downloads", value: dataset.downloadCount?.toLocaleString() || "0", icon: Download },
                { label: "Views", value: dataset.viewCount?.toLocaleString() || "0", icon: Eye },
                { label: "Reviews", value: dataset.reviewCount?.toLocaleString() || "0", icon: BarChart3 },
                { label: "Rating", value: dataset.rating ? parseFloat(dataset.rating).toFixed(1) + " / 5" : "No ratings", icon: BarChart3 },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border px-4 py-3"
                  style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                    <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                  </div>
                  <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* ---- Basic Information ---- */}
            <SectionCard
              title="Basic Information"
              icon={Info}
              isEditing={editingSection === "basicInfo"}
              onEdit={startEditBasicInfo}
              onCancel={() => setEditingSection(null)}
              onSave={saveBasicInfo}
              isSaving={isSaving}
              editContent={
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs">Dataset Title *</Label>
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mt-1.5" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Dataset Type *</Label>
                      <Select value={editSuperType} onValueChange={setEditSuperType}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SUPER_TYPE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Visibility</Label>
                      <Select value={editVisibility} onValueChange={(v) => setEditVisibility(v as DatasetVisibility)}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PUBLIC">Public</SelectItem>
                          <SelectItem value="PRIVATE">Private</SelectItem>
                          <SelectItem value="UNLISTED">Unlisted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Category *</Label>
                      <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Source *</Label>
                      <Select value={editSourceId} onValueChange={setEditSourceId}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {sources.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">License *</Label>
                    <Input value={editLicense} onChange={(e) => setEditLicense(e.target.value)} className="mt-1.5" placeholder="e.g., MIT, Apache 2.0" />
                  </div>
                  <Separator style={{ backgroundColor: "var(--border-default)" }} />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium">Paid Dataset</Label>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Enable to set a price</p>
                    </div>
                    <Switch checked={editIsPaid} onCheckedChange={setEditIsPaid} />
                  </div>
                  {editIsPaid && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Price *</Label>
                        <Input type="number" step="0.01" min="0" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="mt-1.5" />
                      </div>
                      <div>
                        <Label className="text-xs">Currency</Label>
                        <Select value={editCurrency} onValueChange={(v) => setEditCurrency(v as Currency)}>
                          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                <InfoField label="Title" value={dataset.title} />
                <InfoField label="Dataset Type" value={getSuperTypeLabel(dataset.superType)} />
                <InfoField label="Visibility" value={
                  <span className="inline-flex items-center gap-1.5">
                    {dataset.visibility === "PUBLIC" ? <Eye className="w-3.5 h-3.5" /> : dataset.visibility === "PRIVATE" ? <EyeOff className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {dataset.visibility}
                  </span>
                } />
                <InfoField label="Category" value={primaryCategory?.name} />
                <InfoField label="Source" value={source?.name} />
                <InfoField label="License" value={dataset.license} />
                <InfoField label="Pricing" value={
                  dataset.isPaid ? (
                    <span className="inline-flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {dataset.currency} {dataset.price}
                    </span>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Free</Badge>
                  )
                } />
                <InfoField label="Created" value={formatDate(dataset.createdAt)} />
                <InfoField label="Updated" value={formatDate(dataset.updatedAt)} />
                {dataset.publishedAt && (
                  <InfoField label="Published" value={formatDate(dataset.publishedAt)} />
                )}
              </div>
            </SectionCard>

            {/* ---- About Dataset ---- */}
            <SectionCard
              title="About Dataset"
              icon={FileText}
              isEditing={editingSection === "aboutDataset"}
              onEdit={startEditAbout}
              onCancel={() => setEditingSection(null)}
              onSave={saveAboutDataset}
              isSaving={isSaving}
              editContent={
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs">Overview *</Label>
                    <Textarea value={editOverview} onChange={(e) => setEditOverview(e.target.value)} className="mt-1.5 min-h-[80px]" />
                  </div>
                  <div>
                    <Label className="text-xs">Description *</Label>
                    <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="mt-1.5 min-h-[100px]" />
                  </div>
                  <div>
                    <Label className="text-xs">Data Quality *</Label>
                    <Textarea value={editDataQuality} onChange={(e) => setEditDataQuality(e.target.value)} className="mt-1.5 min-h-[80px]" />
                  </div>
                  <Separator style={{ backgroundColor: "var(--border-default)" }} />
                  <div>
                    <Label className="text-xs">Use Cases</Label>
                    <Textarea value={editUseCases} onChange={(e) => setEditUseCases(e.target.value)} className="mt-1.5 min-h-[60px]" placeholder="Potential use cases" />
                  </div>
                  <div>
                    <Label className="text-xs">Limitations</Label>
                    <Textarea value={editLimitations} onChange={(e) => setEditLimitations(e.target.value)} className="mt-1.5 min-h-[60px]" placeholder="Known limitations" />
                  </div>
                  <div>
                    <Label className="text-xs">Methodology</Label>
                    <Textarea value={editMethodology} onChange={(e) => setEditMethodology(e.target.value)} className="mt-1.5 min-h-[60px]" placeholder="Data collection methodology" />
                  </div>
                </div>
              }
            >
              {aboutDatasetInfo ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Overview</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{aboutDatasetInfo.overview}</p>
                  </div>
                  <Separator style={{ backgroundColor: "var(--border-default)" }} />
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Description</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>{aboutDatasetInfo.description}</p>
                  </div>
                  <Separator style={{ backgroundColor: "var(--border-default)" }} />
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Data Quality</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{aboutDatasetInfo.dataQuality}</p>
                  </div>
                  {(aboutDatasetInfo.useCases || aboutDatasetInfo.limitations || aboutDatasetInfo.methodology) && (
                    <>
                      <Separator style={{ backgroundColor: "var(--border-default)" }} />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {aboutDatasetInfo.useCases && (
                          <div>
                            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Use Cases</p>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{aboutDatasetInfo.useCases}</p>
                          </div>
                        )}
                        {aboutDatasetInfo.limitations && (
                          <div>
                            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Limitations</p>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{aboutDatasetInfo.limitations}</p>
                          </div>
                        )}
                        {aboutDatasetInfo.methodology && (
                          <div>
                            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Methodology</p>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{aboutDatasetInfo.methodology}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No about information added yet. Click Edit to add.</p>
                </div>
              )}
            </SectionCard>

            {/* ---- Location Information ---- */}
            <SectionCard
              title="Location Information"
              icon={MapPin}
              isEditing={editingSection === "location"}
              onEdit={startEditLocation}
              onCancel={() => setEditingSection(null)}
              onSave={saveLocation}
              isSaving={isSaving}
              editContent={
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Country</Label>
                    <Input value={editCountry} onChange={(e) => setEditCountry(e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-xs">State / Province</Label>
                    <Input value={editState} onChange={(e) => setEditState(e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-xs">City</Label>
                    <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-xs">Region</Label>
                    <Input value={editRegion} onChange={(e) => setEditRegion(e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-xs">Coordinates</Label>
                    <Input value={editCoordinates} onChange={(e) => setEditCoordinates(e.target.value)} className="mt-1.5" placeholder="Lat, Long" />
                  </div>
                  <div>
                    <Label className="text-xs">Coverage</Label>
                    <Input value={editCoverage} onChange={(e) => setEditCoverage(e.target.value)} className="mt-1.5" placeholder="e.g., National, Regional" />
                  </div>
                </div>
              }
            >
              {locationInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                  <InfoField label="Country" value={locationInfo.country} />
                  <InfoField label="State / Province" value={locationInfo.state} />
                  <InfoField label="City" value={locationInfo.city} />
                  <InfoField label="Region" value={locationInfo.region} />
                  <InfoField label="Coordinates" value={locationInfo.coordinates} />
                  <InfoField label="Coverage" value={locationInfo.coverage} />
                </div>
              ) : (
                <div className="text-center py-6">
                  <MapPin className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No location information added yet. Click Edit to add.</p>
                </div>
              )}
            </SectionCard>

            {/* ---- Data Format ---- */}
            <SectionCard
              title="Data Format"
              icon={Database}
              isEditing={editingSection === "dataFormat"}
              onEdit={startEditDataFormat}
              onCancel={() => setEditingSection(null)}
              onSave={saveDataFormat}
              isSaving={isSaving}
              editContent={
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">File Format</Label>
                    <Input value={editFileFormat} onChange={(e) => setEditFileFormat(e.target.value)} className="mt-1.5" placeholder="e.g., CSV, JSON" />
                  </div>
                  <div>
                    <Label className="text-xs">Rows</Label>
                    <Input type="number" value={editRows} onChange={(e) => setEditRows(e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-xs">Columns</Label>
                    <Input type="number" value={editCols} onChange={(e) => setEditCols(e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-xs">File Size (bytes)</Label>
                    <Input value={editFileSize} onChange={(e) => setEditFileSize(e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-xs">Compression</Label>
                    <Input value={editCompression} onChange={(e) => setEditCompression(e.target.value)} className="mt-1.5" placeholder="e.g., GZIP, None" />
                  </div>
                  <div>
                    <Label className="text-xs">Encoding</Label>
                    <Input value={editEncoding} onChange={(e) => setEditEncoding(e.target.value)} className="mt-1.5" placeholder="e.g., UTF-8" />
                  </div>
                </div>
              }
            >
              {dataFormatInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                  <InfoField label="File Format" value={dataFormatInfo.fileFormat} />
                  <InfoField label="Rows" value={dataFormatInfo.rows?.toLocaleString()} />
                  <InfoField label="Columns" value={dataFormatInfo.cols?.toLocaleString()} />
                  <InfoField label="File Size" value={formatFileSize(dataFormatInfo.fileSize)} />
                  <InfoField label="Compression" value={dataFormatInfo.compressionType} />
                  <InfoField label="Encoding" value={dataFormatInfo.encoding} />
                </div>
              ) : (
                <div className="text-center py-6">
                  <Database className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No data format information added yet. Click Edit to add.</p>
                </div>
              )}
            </SectionCard>

            {/* ---- Features ---- */}
            {features && features.length > 0 && (
              <div className="rounded-xl border" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
                <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border-default)" }}>
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-[18px] h-[18px]" style={{ color: "var(--text-muted)" }} />
                    <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Features</h3>
                    <Badge variant="secondary" className="text-xs">{features.length}</Badge>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: "var(--border-default)" }}>
                          <th className="text-left py-2 pr-4 text-xs font-medium" style={{ color: "var(--text-muted)" }}>Name</th>
                          <th className="text-left py-2 pr-4 text-xs font-medium" style={{ color: "var(--text-muted)" }}>Data Type</th>
                          <th className="text-left py-2 pr-4 text-xs font-medium" style={{ color: "var(--text-muted)" }}>Nullable</th>
                          <th className="text-left py-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {features.map((feature) => (
                          <tr key={feature.id} className="border-b last:border-0" style={{ borderColor: "var(--border-default)" }}>
                            <td className="py-2.5 pr-4 font-medium" style={{ color: "var(--text-primary)" }}>{feature.name}</td>
                            <td className="py-2.5 pr-4"><Badge variant="outline" className="text-xs font-mono">{feature.dataType}</Badge></td>
                            <td className="py-2.5 pr-4" style={{ color: "var(--text-muted)" }}>{feature.isNullable ? "Yes" : "No"}</td>
                            <td className="py-2.5" style={{ color: "var(--text-muted)" }}>{feature.description || "\u2014"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ---- Tags ---- */}
            <SectionCard
              title="Tags"
              icon={Tag}
              isEditing={editingSection === "tags"}
              onEdit={startEditTags}
              onCancel={() => setEditingSection(null)}
              onSave={saveTags}
              isSaving={isSaving}
              editContent={
                <div>
                  <Label className="text-xs">Tags (comma-separated)</Label>
                  <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} className="mt-1.5" placeholder="e.g., finance, healthcare, analytics" />
                  <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>Separate multiple tags with commas</p>
                </div>
              }
            >
              {tags && tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs px-3 py-1">{tag.name}</Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Tag className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No tags added yet. Click Edit to add.</p>
                </div>
              )}
            </SectionCard>

            {/* ---- Published Upload ---- */}
            {publishedUpload && (
              <div className="rounded-xl border" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
                <div className="flex items-center gap-2.5 px-6 py-4 border-b" style={{ borderColor: "var(--border-default)" }}>
                  <Upload className="w-[18px] h-[18px]" style={{ color: "var(--text-muted)" }} />
                  <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Published Upload</h3>
                </div>
                <div className="px-6 py-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                    <InfoField label="File Name" value={publishedUpload.originalFileName} />
                    <InfoField label="Content Type" value={publishedUpload.contentType} />
                    <InfoField label="Size" value={formatFileSize(publishedUpload.sizeBytes)} />
                    <InfoField label="Scope" value={<Badge variant={publishedUpload.scope === "FINAL" ? "default" : "outline"} className="text-xs">{publishedUpload.scope}</Badge>} />
                    <InfoField label="Status" value={<Badge variant="secondary" className="text-xs">{publishedUpload.status}</Badge>} />
                    <InfoField label="Uploaded" value={formatDate(publishedUpload.uploadedAt || publishedUpload.createdAt)} />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ================ UPLOADS TAB ================ */}
          <TabsContent value="uploads" className="mt-0">
            <div className="rounded-xl border" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border-default)" }}>
                <div className="flex items-center gap-2.5">
                  <Upload className="w-[18px] h-[18px]" style={{ color: "var(--text-muted)" }} />
                  <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Dataset Uploads</h3>
                  {(uploadsData?.pagination?.total ?? uploads.length) > 0 && (
                    <Badge variant="secondary" className="text-xs">{uploadsData?.pagination?.total ?? uploads.length}</Badge>
                  )}
                </div>
                <Button size="sm" onClick={() => setUploadDialogOpen(true)} className="h-8 text-xs" style={{ backgroundColor: "var(--brand-primary)", color: "#fff" }}>
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Upload File
                </Button>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 px-6 py-3 border-b" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Scope:</span>
                  <Select value={uploadScopeFilter} onValueChange={(v) => setUploadScopeFilter(v as UploadScope | "ALL")}>
                    <SelectTrigger className="h-7 text-xs w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Scopes</SelectItem>
                      <SelectItem value="FINAL">Final</SelectItem>
                      <SelectItem value="VERIFICATION">Verification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Status:</span>
                  <Select value={uploadStatusFilter} onValueChange={(v) => setUploadStatusFilter(v as UploadStatus | "ALL")}>
                    <SelectTrigger className="h-7 text-xs w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="UPLOADING">Uploading</SelectItem>
                      <SelectItem value="UPLOADED">Uploaded</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="PROMOTED">Promoted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Upload list */}
              <div className="px-6 py-4">
                {uploads.length > 0 ? (
                  <div className="space-y-3">
                    {uploads.map((upload) => (
                      <div
                        key={upload.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                        style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0" style={{ backgroundColor: "var(--bg-base)" }}>
                            <FileText className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                              {upload.originalFileName || "Unnamed Upload"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                              <span>{formatFileSize(upload.sizeBytes)}</span>
                              <span>&middot;</span>
                              <span>{formatDateShort(upload.createdAt)}</span>
                              {upload.contentType && (
                                <>
                                  <span>&middot;</span>
                                  <span>{upload.contentType}</span>
                                </>
                              )}
                              {upload.uploadedAt && (
                                <>
                                  <span>&middot;</span>
                                  <span>Uploaded {formatDateShort(upload.uploadedAt)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          <Badge variant={upload.scope === "FINAL" ? "default" : "outline"} className="text-xs">{upload.scope}</Badge>
                          <Badge
                            variant={upload.status === "UPLOADED" ? "secondary" : upload.status === "PROMOTED" ? "default" : upload.status === "FAILED" ? "destructive" : "outline"}
                            className="text-xs"
                          >
                            {upload.status}
                          </Badge>
                          {(upload.status === "UPLOADED" || upload.status === "PROMOTED") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              disabled={downloadingUploadId === upload.id}
                              onClick={() => handleDownloadUpload(upload.id)}
                              title="Download file"
                            >
                              {downloadingUploadId === upload.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                    <p className="font-medium text-sm mb-1" style={{ color: "var(--text-primary)" }}>No uploads yet</p>
                    <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                      {uploadScopeFilter !== "ALL" || uploadStatusFilter !== "ALL"
                        ? "No uploads match the current filters"
                        : "Upload a file to get started with this dataset"}
                    </p>
                    {uploadScopeFilter === "ALL" && uploadStatusFilter === "ALL" && (
                      <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)} className="h-8 text-xs">
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        Upload File
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ================ KDTS TAB ================ */}
          <TabsContent value="kdts" className="mt-0">
            <DatasetKdtsView datasetId={datasetId} isAdmin={true} />
          </TabsContent>

          {/* ================ AUDIT LOG TAB ================ */}
          <TabsContent value="audit" className="mt-0">
            <DatasetAuditLog auditLog={mockAuditLog} />
          </TabsContent>
        </Tabs>
      </div>

      {/* ============ DIALOGS ============ */}
      <UploadDatasetDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        datasetId={datasetId}
        onUploadComplete={() => {
          refetch();
          refetchUploads();
        }}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Dataset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{dataset.title}</strong>? This will archive the dataset and it will no longer be accessible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteDatasetMutation.isPending}>
              {deleteDatasetMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete Dataset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Dataset</DialogTitle>
            <DialogDescription>
              Publishing <strong>{dataset.title}</strong> will make it available to users based on its visibility settings ({dataset.visibility.toLowerCase()}).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePublish} disabled={publishDatasetMutation.isPending} style={{ backgroundColor: "var(--brand-primary)", color: "#fff" }}>
              {publishDatasetMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={unpublishDialogOpen} onOpenChange={setUnpublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unpublish Dataset</DialogTitle>
            <DialogDescription>
              Unpublishing <strong>{dataset.title}</strong> will remove it from public access. Its status will revert to Verified.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnpublishDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUnpublish} disabled={unpublishDatasetMutation.isPending}>
              {unpublishDatasetMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Unpublish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
