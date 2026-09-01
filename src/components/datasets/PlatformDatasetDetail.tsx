'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  formatEnumLabel,
  formatStatusLabel,
  StatusBadge,
  getDatasetStatusSemantic,
} from '@/components/shared/StatusBadge';
import { DatasetKdtsView } from './DatasetKdtsView';
import { DatasetAuditLog } from './DatasetAuditLog';
import { UploadDatasetDialog } from './UploadDatasetDialog';
import {
  useDataset,
  useDatasetUploads,
  useUpdateDataset,
  useUpdateDatasetMetadata,
  useDeleteDataset,
  usePublishDataset,
  useUnpublishDataset,
  useDownloadUploadUrl,
} from '@/hooks/api/useDatasets';
import { useCategories } from '@/hooks/api/useCategories';
import { useSources } from '@/hooks/api/useSources';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { openExternalUrl } from '@/lib/utils/url.utils';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ENCODING_TYPES } from '@/types';
import type {
  UpdateDatasetRequest,
  UpdateDatasetMetadataRequest,
  DatasetVisibility,
  Currency,
  UploadScope,
  UploadStatus,
  FileFormat,
  CompressionType,
  EncodingType,
} from '@/types';

// ============================================
// Constants
// ============================================

const SUPER_TYPE_OPTIONS = [
  { value: 'CROSS_SECTIONAL', label: 'Cross-Sectional' },
  { value: 'TIME_SERIES', label: 'Time Series' },
  { value: 'PANEL', label: 'Panel' },
  { value: 'POOLED_CROSS_SECTIONAL', label: 'Pooled Cross-Sectional' },
  { value: 'REPEATED_CROSS_SECTIONS', label: 'Repeated Cross-Sections' },
  { value: 'SPATIAL', label: 'Spatial' },
  { value: 'SPATIO_TEMPORAL', label: 'Spatio-Temporal' },
  { value: 'EXPERIMENTAL', label: 'Experimental' },
  { value: 'OBSERVATIONAL', label: 'Observational' },
  { value: 'BIG_DATA', label: 'Big Data' },
  { value: 'EVENT_HISTORY_SURVIVAL', label: 'Event History / Survival' },
  { value: 'HIERARCHICAL_MULTILEVEL', label: 'Hierarchical / Multilevel' },
];

function getSuperTypeLabel(value: string) {
  return SUPER_TYPE_OPTIONS.find((o) => o.value === value)?.label || formatEnumLabel(value);
}

// ============================================
// Helpers
// ============================================

function formatDate(date: string | null) {
  if (!date) return '\u2014';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(date: string | null) {
  if (!date) return '\u2014';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatFileSize(bytes: string | null) {
  if (!bytes) return '\u2014';
  const num = parseInt(bytes, 10);
  if (isNaN(num)) return bytes;
  if (num < 1024) return num + ' B';
  if (num < 1024 * 1024) return (num / 1024).toFixed(1) + ' KB';
  if (num < 1024 * 1024 * 1024) return (num / (1024 * 1024)).toFixed(2) + ' MB';
  return (num / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  } catch {
    toast.error('Could not copy the dataset ID');
  }
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
  canEdit = true,
  saveDisabled = false,
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
  canEdit?: boolean;
  saveDisabled?: boolean;
}) {
  return (
    <div
      className="rounded-xl border transition-colors"
      style={{
        backgroundColor: 'var(--bg-base)',
        borderColor: isEditing ? 'var(--brand-primary)' : 'var(--border-default)',
      }}
    >
      <div
        className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-[18px] h-[18px]" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
          {badge}
        </div>
        {isEditing && canEdit ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSaving}
              className="h-8 px-3 text-xs"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={isSaving || saveDisabled}
              className="h-8 px-3 text-xs"
              style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-on-primary)' }}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 mr-1" />
              )}
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        ) : canEdit ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 px-3 text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>
        ) : null}
      </div>
      <div className="px-6 py-5">{isEditing ? editContent : children}</div>
    </div>
  );
}

function InfoField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
        {value || '\u2014'}
      </div>
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
  const [activeTab, setActiveTab] = useState('overview');

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [unpublishReason, setUnpublishReason] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Upload filters
  const [uploadScopeFilter, setUploadScopeFilter] = useState<UploadScope | 'ALL'>('ALL');
  const [uploadStatusFilter, setUploadStatusFilter] = useState<UploadStatus | 'ALL'>('ALL');
  const [downloadingUploadId, setDownloadingUploadId] = useState<string | null>(null);

  // Inline editing
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch data
  const { data: datasetData, isLoading, isError, error, refetch } = useDataset(datasetId);
  const {
    data: uploadsData,
    isError: uploadsError,
    refetch: refetchUploads,
  } = useDatasetUploads(datasetId, {
    scope: uploadScopeFilter === 'ALL' ? undefined : uploadScopeFilter,
    status: uploadStatusFilter === 'ALL' ? undefined : uploadStatusFilter,
  });
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useCategories({ pageSize: 200, sort: 'name:asc' });
  const {
    data: sourcesData,
    isLoading: sourcesLoading,
    isError: sourcesError,
    refetch: refetchSources,
  } = useSources({
    pageSize: 200,
    createdByType: 'PLATFORM',
    sort: 'name:asc',
  });

  // Mutations
  const updateDatasetMutation = useUpdateDataset();
  const updateMetadataMutation = useUpdateDatasetMetadata();
  const deleteDatasetMutation = useDeleteDataset();
  const publishDatasetMutation = usePublishDataset();
  const unpublishDatasetMutation = useUnpublishDataset();
  const downloadUrlMutation = useDownloadUploadUrl();
  const { can } = useAuthorization();
  const canUpdateDataset = can({ anyOf: [PERMISSIONS.DATASETS.UPDATE_PLATFORM] });
  const canEditMetadata = can({ anyOf: [PERMISSIONS.DATASETS.EDIT_METADATA] });
  const canPublishDataset = can({ anyOf: [PERMISSIONS.DATASETS.PUBLISH_PLATFORM] });
  const canUnpublishDataset = can({ anyOf: [PERMISSIONS.DATASETS.UNPUBLISH] });
  const canDeleteDataset = can({ anyOf: [PERMISSIONS.DATASETS.DELETE_PLATFORM] });

  // ---- Basic Info edit state ----
  const [editTitle, setEditTitle] = useState('');
  const [editVisibility, setEditVisibility] = useState<DatasetVisibility>('PUBLIC');
  const [editSuperType, setEditSuperType] = useState('CROSS_SECTIONAL');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editSourceId, setEditSourceId] = useState('');
  const [editLicense, setEditLicense] = useState('');
  const [editIsPaid, setEditIsPaid] = useState(false);
  const [editPrice, setEditPrice] = useState('');
  const [editCurrency, setEditCurrency] = useState<Currency>('INR');

  // ---- About Dataset edit state ----
  const [editOverview, setEditOverview] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDataQuality, setEditDataQuality] = useState('');
  const [editUseCases, setEditUseCases] = useState('');
  const [editLimitations, setEditLimitations] = useState('');
  const [editMethodology, setEditMethodology] = useState('');

  // ---- Location edit state ----
  const [editCountry, setEditCountry] = useState('');
  const [editState, setEditState] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editCoordinates, setEditCoordinates] = useState('');
  const [editCoverage, setEditCoverage] = useState('');

  // ---- Data Format edit state ----
  const [editFileFormat, setEditFileFormat] = useState<string>('');
  const [editRows, setEditRows] = useState('');
  const [editCols, setEditCols] = useState('');
  const [editFileSize, setEditFileSize] = useState('');
  const [editCompression, setEditCompression] = useState<string>('');
  const [editEncoding, setEditEncoding] = useState<EncodingType>('UTF-8');

  // ---- Features edit state ----
  const [editFeatures, setEditFeatures] = useState<
    Array<{ name: string; dataType: string; description: string; isNullable: boolean }>
  >([]);

  // ---- Tags edit state ----
  const [editTags, setEditTags] = useState('');

  const categories = categoriesData?.items || [];
  const sources = sourcesData?.items || [];
  const basicInfoLookupUnavailable = categoriesError || sourcesError;

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
    setEditIsPaid(d.pricing?.isPaid ?? false);
    setEditPrice(d.pricing?.price ?? '');
    setEditCurrency(d.pricing?.currency ?? 'INR');
    setEditingSection('basicInfo');
  }, [datasetData]);

  const startEditAbout = useCallback(() => {
    const a = datasetData?.aboutDatasetInfo;
    setEditOverview(a?.overview || '');
    setEditDescription(a?.description || '');
    setEditDataQuality(a?.dataQuality || '');
    setEditUseCases(a?.useCases || '');
    setEditLimitations(a?.limitations || '');
    setEditMethodology(a?.methodology || '');
    setEditingSection('aboutDataset');
  }, [datasetData]);

  const startEditLocation = useCallback(() => {
    const l = datasetData?.locationInfo;
    setEditCountry(l?.country || '');
    setEditState(l?.state || '');
    setEditCity(l?.city || '');
    setEditRegion(l?.region || '');
    setEditCoordinates(l?.coordinates || '');
    setEditCoverage(l?.coverage || '');
    setEditingSection('location');
  }, [datasetData]);

  const startEditDataFormat = useCallback(() => {
    const f = datasetData?.dataFormatInfo;
    const normalizedEncoding: EncodingType =
      f?.encoding && ENCODING_TYPES.includes(f.encoding as EncodingType)
        ? (f.encoding as EncodingType)
        : 'UTF-8';
    setEditFileFormat(f?.fileFormat || '');
    setEditRows(f?.rows?.toString() || '');
    setEditCols(f?.cols?.toString() || '');
    setEditFileSize(f?.fileSize || '');
    setEditCompression(f?.compressionType || '');
    setEditEncoding(normalizedEncoding);
    setEditingSection('dataFormat');
  }, [datasetData]);

  const startEditFeatures = useCallback(() => {
    const f = datasetData?.features || [];
    setEditFeatures(
      f.map((feat) => ({
        name: feat.name,
        dataType: feat.dataType,
        description: feat.description || '',
        isNullable: feat.isNullable,
      }))
    );
    setEditingSection('features');
  }, [datasetData]);

  const startEditTags = useCallback(() => {
    const t = datasetData?.tags || [];
    setEditTags(t.map((tag) => tag.name).join(', '));
    setEditingSection('tags');
  }, [datasetData]);

  // ============================================
  // Save handlers
  // ============================================

  const saveBasicInfo = useCallback(async () => {
    const title = editTitle.trim();
    const license = editLicense.trim();
    const price = editPrice.trim();
    if (basicInfoLookupUnavailable || !categories.length || !sources.length) {
      toast.error('Categories and sources must load before basic information can be saved');
      return;
    }
    if (!title || !editCategoryId || !editSourceId || !license) {
      toast.error('Title, category, source, and license are required');
      return;
    }
    if (
      editIsPaid &&
      (!/^\d+(?:\.\d+)?$/.test(price) || !Number.isFinite(Number(price)) || Number(price) <= 0)
    ) {
      toast.error('Enter a positive price for a paid dataset');
      return;
    }

    setIsSaving(true);
    try {
      const data: UpdateDatasetRequest = {
        title,
        visibility: editVisibility,
        superType: editSuperType,
        primaryCategoryId: editCategoryId,
        sourceId: editSourceId,
        license,
        pricing: {
          isPaid: editIsPaid,
          price: editIsPaid ? price : null,
          currency: editCurrency,
        },
      };
      await updateDatasetMutation.mutateAsync({ datasetId, data });
      setEditingSection(null);
      refetch();
    } catch {
      // handled by mutation
    } finally {
      setIsSaving(false);
    }
  }, [
    datasetId,
    editTitle,
    editVisibility,
    editSuperType,
    editCategoryId,
    editSourceId,
    editLicense,
    editIsPaid,
    editPrice,
    editCurrency,
    basicInfoLookupUnavailable,
    categories.length,
    sources.length,
    updateDatasetMutation,
    refetch,
  ]);

  const saveAboutDataset = useCallback(async () => {
    const overview = editOverview.trim();
    const description = editDescription.trim();
    const dataQuality = editDataQuality.trim();
    if (!overview || !description || !dataQuality) {
      toast.error('Overview, description, and data quality are required');
      return;
    }

    setIsSaving(true);
    try {
      const data: UpdateDatasetMetadataRequest = {
        aboutDatasetInfo: {
          overview,
          description,
          dataQuality,
          useCases: editUseCases.trim() || null,
          limitations: editLimitations.trim() || null,
          methodology: editMethodology.trim() || null,
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
  }, [
    datasetId,
    editOverview,
    editDescription,
    editDataQuality,
    editUseCases,
    editLimitations,
    editMethodology,
    updateMetadataMutation,
    refetch,
  ]);

  const saveLocation = useCallback(async () => {
    setIsSaving(true);
    try {
      const data: UpdateDatasetMetadataRequest = {
        locationInfo: {
          country: editCountry.trim() || undefined,
          state: editState.trim() || null,
          city: editCity.trim() || null,
          region: editRegion.trim() || null,
          coordinates: editCoordinates.trim() || null,
          coverage: editCoverage.trim() || null,
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
  }, [
    datasetId,
    editCountry,
    editState,
    editCity,
    editRegion,
    editCoordinates,
    editCoverage,
    updateMetadataMutation,
    refetch,
  ]);

  const saveDataFormat = useCallback(async () => {
    const rows = editRows.trim() ? Number(editRows) : undefined;
    const cols = editCols.trim() ? Number(editCols) : undefined;
    const fileSize = editFileSize.trim() || undefined;
    if (
      (rows !== undefined && (!Number.isSafeInteger(rows) || rows < 0)) ||
      (cols !== undefined && (!Number.isSafeInteger(cols) || cols < 0)) ||
      (fileSize !== undefined && !/^\d+$/.test(fileSize))
    ) {
      toast.error('Rows, columns, and file size must be non-negative whole numbers');
      return;
    }

    setIsSaving(true);
    try {
      const data: UpdateDatasetMetadataRequest = {
        dataFormatInfo: {
          fileFormat: (editFileFormat || undefined) as FileFormat | undefined,
          rows,
          cols,
          fileSize,
          compressionType: (editCompression || undefined) as CompressionType | undefined,
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
  }, [
    datasetId,
    editFileFormat,
    editRows,
    editCols,
    editFileSize,
    editCompression,
    editEncoding,
    updateMetadataMutation,
    refetch,
  ]);

  const saveFeatures = useCallback(async () => {
    if (editFeatures.some((feature) => !feature.name.trim() || !feature.dataType.trim())) {
      toast.error('Every feature needs a name and data type');
      return;
    }

    setIsSaving(true);
    try {
      const data: UpdateDatasetMetadataRequest = {
        features: editFeatures.map((feature) => ({
          name: feature.name.trim(),
          dataType: feature.dataType.trim(),
          description: feature.description.trim() || null,
          isNullable: feature.isNullable,
        })),
      };
      await updateMetadataMutation.mutateAsync({ datasetId, data });
      setEditingSection(null);
      refetch();
    } catch {
      // handled by mutation
    } finally {
      setIsSaving(false);
    }
  }, [datasetId, editFeatures, updateMetadataMutation, refetch]);

  const saveTags = useCallback(async () => {
    const tags = editTags
      ? editTags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];
    if (tags.length > 100 || tags.some((tag) => tag.length > 100)) {
      toast.error('Use at most 100 tags, with no tag longer than 100 characters');
      return;
    }

    setIsSaving(true);
    try {
      const data: UpdateDatasetMetadataRequest = {
        tags,
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
    router.push('/dashboard/datasets');
  }, [router]);

  const handleDelete = useCallback(async () => {
    const reason = deleteReason.trim();
    if (reason.length < 3) return;
    try {
      await deleteDatasetMutation.mutateAsync({ datasetId, data: { reason } });
      router.push('/dashboard/datasets');
    } catch {
      // handled
    }
  }, [datasetId, deleteDatasetMutation, deleteReason, router]);

  const handleDownloadUpload = useCallback(
    async (uploadId: string) => {
      setDownloadingUploadId(uploadId);
      try {
        const result = await downloadUrlMutation.mutateAsync({ datasetId, uploadId });
        if (!openExternalUrl(result.url)) {
          toast.error('The download service returned an invalid URL');
        }
      } catch {
        // error toast handled by mutation
      } finally {
        setDownloadingUploadId(null);
      }
    },
    [datasetId, downloadUrlMutation]
  );

  const handlePublish = useCallback(async () => {
    const allUploads = uploadsData?.items || [];
    const latestUpload =
      allUploads.find((u) => u.status === 'UPLOADED') || datasetData?.publishedUpload;
    if (!latestUpload?.id) {
      toast.error('No upload available to publish. Upload a file first.');
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
    const reason = unpublishReason.trim();
    if (reason.length < 3) return;
    try {
      await unpublishDatasetMutation.mutateAsync({ datasetId, data: { reason } });
      setUnpublishDialogOpen(false);
      setUnpublishReason('');
      refetch();
    } catch {
      // handled
    }
  }, [datasetId, unpublishDatasetMutation, unpublishReason, refetch]);

  // ============================================
  // Loading & error
  // ============================================

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading dataset...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !datasetData || !datasetData.dataset) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 mx-auto" style={{ color: 'var(--state-error)' }} />
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            Could not load dataset
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {isError
              ? getFriendlyErrorMessage(error)
              : 'The dataset service returned an empty response.'}
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Datasets
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const {
    dataset,
    primaryCategory,
    source,
    aboutDatasetInfo,
    locationInfo,
    dataFormatInfo,
    features,
    tags,
    publishedUpload,
  } = datasetData;
  const isPublished = dataset?.status === 'PUBLISHED';
  const uploads = uploadsData?.items || [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      {/* ============ HEADER ============ */}
      <div
        className="border-b sticky top-0 z-10"
        style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
      >
        <div className="mx-auto max-w-[1200px] px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="mt-0.5 flex-shrink-0 h-8 w-8"
                aria-label="Back to datasets"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1
                    className="text-xl font-bold truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {dataset.title}
                  </h1>
                  <StatusBadge
                    status={formatStatusLabel(dataset.status)}
                    semanticType={getDatasetStatusSemantic(dataset.status)}
                  />
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    {dataset.visibility === 'PUBLIC' ? (
                      <Eye className="w-3 h-3" />
                    ) : dataset.visibility === 'PRIVATE' ? (
                      <EyeOff className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {dataset.visibility}
                  </Badge>
                </div>
                <div
                  className="flex items-center gap-1.5 mt-1 text-xs flex-wrap"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <button
                    type="button"
                    onClick={() => void copyToClipboard(dataset.datasetUniqueId)}
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

            <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
              {isPublished && canUnpublishDataset ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUnpublishDialogOpen(true)}
                  className="h-8 text-xs"
                >
                  <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                  Unpublish
                </Button>
              ) : !isPublished && canPublishDataset ? (
                <Button
                  size="sm"
                  onClick={() => setPublishDialogOpen(true)}
                  className="h-8 text-xs"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--brand-on-primary)',
                  }}
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Publish
                </Button>
              ) : null}
              {canDeleteDataset ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="h-8 border-[var(--status-error-border)] text-xs text-[var(--status-error)] hover:bg-[var(--status-error-bg)] hover:text-[var(--status-error)]"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Archive
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ============ CONTENT ============ */}
      <div className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6 sm:py-6">
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
                {
                  label: 'Downloads',
                  value: dataset.downloadCount?.toLocaleString() || '0',
                  icon: Download,
                },
                { label: 'Views', value: dataset.viewCount?.toLocaleString() || '0', icon: Eye },
                {
                  label: 'Reviews',
                  value: dataset.reviewCount?.toLocaleString() || '0',
                  icon: BarChart3,
                },
                {
                  label: 'Rating',
                  value: dataset.rating
                    ? parseFloat(dataset.rating).toFixed(1) + ' / 5'
                    : 'No ratings',
                  icon: BarChart3,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-default)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {stat.label}
                    </p>
                  </div>
                  <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* ---- Basic Information ---- */}
            <SectionCard
              title="Basic Information"
              icon={Info}
              isEditing={editingSection === 'basicInfo'}
              onEdit={startEditBasicInfo}
              onCancel={() => setEditingSection(null)}
              onSave={saveBasicInfo}
              isSaving={isSaving}
              canEdit={canUpdateDataset}
              saveDisabled={
                basicInfoLookupUnavailable ||
                categoriesLoading ||
                sourcesLoading ||
                categories.length === 0 ||
                sources.length === 0
              }
              editContent={
                <div className="space-y-4">
                  {basicInfoLookupUnavailable ? (
                    <div
                      className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                      role="alert"
                      style={{
                        backgroundColor: 'var(--status-error-bg)',
                        borderColor: 'var(--status-error-border)',
                        color: 'var(--status-error)',
                      }}
                    >
                      <span className="text-sm">
                        Categories or platform sources could not be loaded. Basic information cannot
                        be saved until they are available.
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          void refetchCategories();
                          void refetchSources();
                        }}
                      >
                        Retry lookup data
                      </Button>
                    </div>
                  ) : null}
                  <div>
                    <Label htmlFor="edit-dataset-title" className="text-xs">
                      Dataset Title *
                    </Label>
                    <Input
                      id="edit-dataset-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="mt-1.5"
                      maxLength={200}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-super-type" className="text-xs">
                        Dataset Type *
                      </Label>
                      <Select value={editSuperType} onValueChange={setEditSuperType}>
                        <SelectTrigger id="edit-super-type" className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPER_TYPE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-visibility" className="text-xs">
                        Visibility
                      </Label>
                      <Select
                        value={editVisibility}
                        onValueChange={(v) => setEditVisibility(v as DatasetVisibility)}
                      >
                        <SelectTrigger id="edit-visibility" className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PUBLIC">Public</SelectItem>
                          <SelectItem value="PRIVATE">Private</SelectItem>
                          <SelectItem value="UNLISTED">Unlisted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-category" className="text-xs">
                        Category *
                      </Label>
                      <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                        <SelectTrigger
                          id="edit-category"
                          className="mt-1.5"
                          disabled={categoriesLoading || categoriesError || categories.length === 0}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-source" className="text-xs">
                        Source *
                      </Label>
                      <Select value={editSourceId} onValueChange={setEditSourceId}>
                        <SelectTrigger
                          id="edit-source"
                          className="mt-1.5"
                          disabled={sourcesLoading || sourcesError || sources.length === 0}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sources.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-license" className="text-xs">
                      License *
                    </Label>
                    <Input
                      id="edit-license"
                      value={editLicense}
                      onChange={(e) => setEditLicense(e.target.value)}
                      className="mt-1.5"
                      placeholder="e.g., MIT, Apache 2.0"
                      maxLength={200}
                    />
                  </div>
                  <Separator style={{ backgroundColor: 'var(--border-default)' }} />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="edit-is-paid" className="text-xs font-medium">
                        Paid Dataset
                      </Label>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Enable to set a price
                      </p>
                    </div>
                    <Switch
                      id="edit-is-paid"
                      checked={editIsPaid}
                      onCheckedChange={setEditIsPaid}
                    />
                  </div>
                  {editIsPaid && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="edit-price" className="text-xs">
                          Price *
                        </Label>
                        <Input
                          id="edit-price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-currency" className="text-xs">
                          Currency
                        </Label>
                        <Select
                          value={editCurrency}
                          onValueChange={(v) => setEditCurrency(v as Currency)}
                        >
                          <SelectTrigger id="edit-currency" className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
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
                <InfoField
                  label="Visibility"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      {dataset.visibility === 'PUBLIC' ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : dataset.visibility === 'PRIVATE' ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      {dataset.visibility}
                    </span>
                  }
                />
                <InfoField label="Category" value={primaryCategory?.name} />
                <InfoField label="Source" value={source?.name} />
                <InfoField label="License" value={dataset.license} />
                <InfoField
                  label="Pricing"
                  value={
                    dataset.pricing?.isPaid ? (
                      <span className="inline-flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {dataset.pricing.currency} {dataset.pricing.price}
                      </span>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Free
                      </Badge>
                    )
                  }
                />
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
              isEditing={editingSection === 'aboutDataset'}
              onEdit={startEditAbout}
              onCancel={() => setEditingSection(null)}
              onSave={saveAboutDataset}
              isSaving={isSaving}
              canEdit={canEditMetadata}
              editContent={
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-overview" className="text-xs">
                      Overview *
                    </Label>
                    <Textarea
                      id="edit-overview"
                      value={editOverview}
                      onChange={(e) => setEditOverview(e.target.value)}
                      className="mt-1.5 min-h-[80px]"
                      maxLength={20000}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description" className="text-xs">
                      Description *
                    </Label>
                    <Textarea
                      id="edit-description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="mt-1.5 min-h-[100px]"
                      maxLength={20000}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-data-quality" className="text-xs">
                      Data Quality *
                    </Label>
                    <Textarea
                      id="edit-data-quality"
                      value={editDataQuality}
                      onChange={(e) => setEditDataQuality(e.target.value)}
                      className="mt-1.5 min-h-[80px]"
                      maxLength={20000}
                    />
                  </div>
                  <Separator style={{ backgroundColor: 'var(--border-default)' }} />
                  <div>
                    <Label htmlFor="edit-use-cases" className="text-xs">
                      Use Cases
                    </Label>
                    <Textarea
                      id="edit-use-cases"
                      value={editUseCases}
                      onChange={(e) => setEditUseCases(e.target.value)}
                      className="mt-1.5 min-h-[60px]"
                      placeholder="Potential use cases"
                      maxLength={20000}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-limitations" className="text-xs">
                      Limitations
                    </Label>
                    <Textarea
                      id="edit-limitations"
                      value={editLimitations}
                      onChange={(e) => setEditLimitations(e.target.value)}
                      className="mt-1.5 min-h-[60px]"
                      placeholder="Known limitations"
                      maxLength={20000}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-methodology" className="text-xs">
                      Methodology
                    </Label>
                    <Textarea
                      id="edit-methodology"
                      value={editMethodology}
                      onChange={(e) => setEditMethodology(e.target.value)}
                      className="mt-1.5 min-h-[60px]"
                      placeholder="Data collection methodology"
                      maxLength={20000}
                    />
                  </div>
                </div>
              }
            >
              {aboutDatasetInfo ? (
                <div className="space-y-5">
                  <div>
                    <p
                      className="text-xs font-medium mb-1.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Overview
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {aboutDatasetInfo.overview}
                    </p>
                  </div>
                  <Separator style={{ backgroundColor: 'var(--border-default)' }} />
                  <div>
                    <p
                      className="text-xs font-medium mb-1.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Description
                    </p>
                    <p
                      className="text-sm leading-relaxed whitespace-pre-wrap"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {aboutDatasetInfo.description}
                    </p>
                  </div>
                  <Separator style={{ backgroundColor: 'var(--border-default)' }} />
                  <div>
                    <p
                      className="text-xs font-medium mb-1.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Data Quality
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {aboutDatasetInfo.dataQuality}
                    </p>
                  </div>
                  {(aboutDatasetInfo.useCases ||
                    aboutDatasetInfo.limitations ||
                    aboutDatasetInfo.methodology) && (
                    <>
                      <Separator style={{ backgroundColor: 'var(--border-default)' }} />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {aboutDatasetInfo.useCases && (
                          <div>
                            <p
                              className="text-xs font-medium mb-1.5"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Use Cases
                            </p>
                            <p
                              className="text-sm leading-relaxed"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {aboutDatasetInfo.useCases}
                            </p>
                          </div>
                        )}
                        {aboutDatasetInfo.limitations && (
                          <div>
                            <p
                              className="text-xs font-medium mb-1.5"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Limitations
                            </p>
                            <p
                              className="text-sm leading-relaxed"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {aboutDatasetInfo.limitations}
                            </p>
                          </div>
                        )}
                        {aboutDatasetInfo.methodology && (
                          <div>
                            <p
                              className="text-xs font-medium mb-1.5"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Methodology
                            </p>
                            <p
                              className="text-sm leading-relaxed"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {aboutDatasetInfo.methodology}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText
                    className="w-8 h-8 mx-auto mb-2"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No about information added yet. Click Edit to add.
                  </p>
                </div>
              )}
            </SectionCard>

            {/* ---- Location Information ---- */}
            <SectionCard
              title="Location Information"
              icon={MapPin}
              isEditing={editingSection === 'location'}
              onEdit={startEditLocation}
              onCancel={() => setEditingSection(null)}
              onSave={saveLocation}
              isSaving={isSaving}
              canEdit={canEditMetadata}
              editContent={
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-country" className="text-xs">
                      Country
                    </Label>
                    <Input
                      id="edit-country"
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      className="mt-1.5"
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-state" className="text-xs">
                      State / Province
                    </Label>
                    <Input
                      id="edit-state"
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                      className="mt-1.5"
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-city" className="text-xs">
                      City
                    </Label>
                    <Input
                      id="edit-city"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="mt-1.5"
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-region" className="text-xs">
                      Region
                    </Label>
                    <Input
                      id="edit-region"
                      value={editRegion}
                      onChange={(e) => setEditRegion(e.target.value)}
                      className="mt-1.5"
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-coordinates" className="text-xs">
                      Coordinates
                    </Label>
                    <Input
                      id="edit-coordinates"
                      value={editCoordinates}
                      onChange={(e) => setEditCoordinates(e.target.value)}
                      className="mt-1.5"
                      placeholder="Lat, Long"
                      maxLength={500}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-coverage" className="text-xs">
                      Coverage
                    </Label>
                    <Input
                      id="edit-coverage"
                      value={editCoverage}
                      onChange={(e) => setEditCoverage(e.target.value)}
                      className="mt-1.5"
                      placeholder="e.g., National, Regional"
                      maxLength={1000}
                    />
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
                  <MapPin className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No location information added yet. Click Edit to add.
                  </p>
                </div>
              )}
            </SectionCard>

            {/* ---- Data Format ---- */}
            <SectionCard
              title="Data Format"
              icon={Database}
              isEditing={editingSection === 'dataFormat'}
              onEdit={startEditDataFormat}
              onCancel={() => setEditingSection(null)}
              onSave={saveDataFormat}
              isSaving={isSaving}
              canEdit={canEditMetadata}
              editContent={
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-file-format" className="text-xs">
                      File Format
                    </Label>
                    <Select value={editFileFormat} onValueChange={setEditFileFormat}>
                      <SelectTrigger id="edit-file-format" className="mt-1.5">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CSV">CSV</SelectItem>
                        <SelectItem value="JSON">JSON</SelectItem>
                        <SelectItem value="EXCEL">Excel</SelectItem>
                        <SelectItem value="PARQUET">Parquet</SelectItem>
                        <SelectItem value="SQL">SQL</SelectItem>
                        <SelectItem value="XML">XML</SelectItem>
                        <SelectItem value="TSV">TSV</SelectItem>
                        <SelectItem value="AVRO">Avro</SelectItem>
                        <SelectItem value="HDF5">HDF5</SelectItem>
                        <SelectItem value="PICKLE">Pickle</SelectItem>
                        <SelectItem value="FEATHER">Feather</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-rows" className="text-xs">
                      Rows
                    </Label>
                    <Input
                      id="edit-rows"
                      type="number"
                      min="0"
                      value={editRows}
                      onChange={(e) => setEditRows(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-columns" className="text-xs">
                      Columns
                    </Label>
                    <Input
                      id="edit-columns"
                      type="number"
                      min="0"
                      value={editCols}
                      onChange={(e) => setEditCols(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-file-size" className="text-xs">
                      File Size (bytes)
                    </Label>
                    <Input
                      id="edit-file-size"
                      type="number"
                      min="0"
                      value={editFileSize}
                      onChange={(e) => setEditFileSize(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-compression" className="text-xs">
                      Compression
                    </Label>
                    <Select value={editCompression} onValueChange={setEditCompression}>
                      <SelectTrigger id="edit-compression" className="mt-1.5">
                        <SelectValue placeholder="Select compression" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">None</SelectItem>
                        <SelectItem value="ZIP">ZIP</SelectItem>
                        <SelectItem value="GZIP">GZIP</SelectItem>
                        <SelectItem value="BZIP2">BZIP2</SelectItem>
                        <SelectItem value="TAR">TAR</SelectItem>
                        <SelectItem value="RAR">RAR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-encoding" className="text-xs">
                      Encoding
                    </Label>
                    <Select
                      value={editEncoding}
                      onValueChange={(value) => setEditEncoding(value as EncodingType)}
                    >
                      <SelectTrigger id="edit-encoding" className="mt-1.5">
                        <SelectValue placeholder="Select encoding" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENCODING_TYPES.map((encodingOption) => (
                          <SelectItem key={encodingOption} value={encodingOption}>
                            {encodingOption}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <Database
                    className="w-8 h-8 mx-auto mb-2"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No data format information added yet. Click Edit to add.
                  </p>
                </div>
              )}
            </SectionCard>

            {/* ---- Features ---- */}
            <SectionCard
              title="Features"
              icon={Shield}
              isEditing={editingSection === 'features'}
              onEdit={startEditFeatures}
              onCancel={() => setEditingSection(null)}
              onSave={saveFeatures}
              isSaving={isSaving}
              canEdit={canEditMetadata}
              badge={
                features && features.length > 0 ? (
                  <Badge variant="secondary" className="text-xs">
                    {features.length}
                  </Badge>
                ) : undefined
              }
              editContent={
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() =>
                      setEditFeatures([
                        ...editFeatures,
                        { name: '', dataType: '', description: '', isNullable: false },
                      ])
                    }
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Feature
                  </Button>

                  {editFeatures.length > 0 && (
                    <div
                      className="rounded-lg border overflow-hidden"
                      style={{ borderColor: 'var(--border-default)' }}
                    >
                      {/* Column headers */}
                      <div
                        className="hidden grid-cols-[1fr_1fr_1.2fr_4.5rem_2.5rem] gap-x-3 border-b px-3 py-2 text-xs font-medium md:grid"
                        style={{
                          borderColor: 'var(--border-default)',
                          color: 'var(--text-muted)',
                          backgroundColor: 'var(--bg-surface)',
                        }}
                      >
                        <span>
                          Name <span className="text-[var(--status-error)]">*</span>
                        </span>
                        <span>
                          Data Type <span className="text-[var(--status-error)]">*</span>
                        </span>
                        <span>Description</span>
                        <span className="text-center">Nullable</span>
                        <span />
                      </div>

                      {/* Feature rows */}
                      {editFeatures.map((feature, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 items-center gap-3 border-b p-3 last:border-0 md:grid-cols-[1fr_1fr_1.2fr_4.5rem_2.5rem] md:gap-x-3 md:py-2"
                          style={{ borderColor: 'var(--border-default)' }}
                        >
                          <Input
                            aria-label={`Feature ${idx + 1} name`}
                            value={feature.name}
                            onChange={(e) => {
                              const value = e.target.value;
                              setEditFeatures((current) =>
                                current.map((item, index) =>
                                  index === idx ? { ...item, name: value } : item
                                )
                              );
                            }}
                            placeholder="e.g., age"
                            className="h-8 text-sm"
                            maxLength={200}
                          />
                          <Input
                            aria-label={`Feature ${idx + 1} data type`}
                            value={feature.dataType}
                            onChange={(e) => {
                              const value = e.target.value;
                              setEditFeatures((current) =>
                                current.map((item, index) =>
                                  index === idx ? { ...item, dataType: value } : item
                                )
                              );
                            }}
                            placeholder="e.g., INTEGER"
                            className="h-8 text-sm"
                            maxLength={100}
                          />
                          <Input
                            aria-label={`Feature ${idx + 1} description`}
                            value={feature.description}
                            onChange={(e) => {
                              const value = e.target.value;
                              setEditFeatures((current) =>
                                current.map((item, index) =>
                                  index === idx ? { ...item, description: value } : item
                                )
                              );
                            }}
                            placeholder="Optional"
                            className="h-8 text-sm"
                            maxLength={5000}
                          />
                          <div className="flex justify-center">
                            <Switch
                              aria-label={`Feature ${idx + 1} is nullable`}
                              checked={feature.isNullable}
                              onCheckedChange={(checked) => {
                                setEditFeatures((current) =>
                                  current.map((item, index) =>
                                    index === idx ? { ...item, isNullable: checked } : item
                                  )
                                );
                              }}
                            />
                          </div>
                          <div className="flex justify-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-[var(--status-error)] hover:bg-[var(--status-error-bg)] hover:text-[var(--status-error)]"
                              aria-label={`Remove feature ${idx + 1}`}
                              onClick={() =>
                                setEditFeatures((current) =>
                                  current.filter((_, index) => index !== idx)
                                )
                              }
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {editFeatures.length === 0 && (
                    <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                      No features yet. Click &ldquo;Add Feature&rdquo; to define dataset columns.
                    </p>
                  )}
                </div>
              }
            >
              {features && features.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--border-default)' }}>
                        <th
                          className="text-left py-2 pr-4 text-xs font-medium"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Name
                        </th>
                        <th
                          className="text-left py-2 pr-4 text-xs font-medium"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Data Type
                        </th>
                        <th
                          className="text-left py-2 pr-4 text-xs font-medium"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Nullable
                        </th>
                        <th
                          className="text-left py-2 text-xs font-medium"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {features.map((feature) => (
                        <tr
                          key={feature.id}
                          className="border-b last:border-0"
                          style={{ borderColor: 'var(--border-default)' }}
                        >
                          <td
                            className="py-2.5 pr-4 font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {feature.name}
                          </td>
                          <td className="py-2.5 pr-4">
                            <Badge variant="outline" className="text-xs font-mono">
                              {feature.dataType}
                            </Badge>
                          </td>
                          <td className="py-2.5 pr-4" style={{ color: 'var(--text-muted)' }}>
                            {feature.isNullable ? 'Yes' : 'No'}
                          </td>
                          <td className="py-2.5" style={{ color: 'var(--text-muted)' }}>
                            {feature.description || '\u2014'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Shield className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No features added yet. Click Edit to define dataset columns/fields.
                  </p>
                </div>
              )}
            </SectionCard>

            {/* ---- Tags ---- */}
            <SectionCard
              title="Tags"
              icon={Tag}
              isEditing={editingSection === 'tags'}
              onEdit={startEditTags}
              onCancel={() => setEditingSection(null)}
              onSave={saveTags}
              isSaving={isSaving}
              canEdit={canEditMetadata}
              editContent={
                <div>
                  <Label htmlFor="edit-tags" className="text-xs">
                    Tags (comma-separated)
                  </Label>
                  <Input
                    id="edit-tags"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="mt-1.5"
                    placeholder="e.g., finance, healthcare, analytics"
                  />
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    Separate multiple tags with commas
                  </p>
                </div>
              }
            >
              {tags && tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs px-3 py-1">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Tag className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No tags added yet. Click Edit to add.
                  </p>
                </div>
              )}
            </SectionCard>

            {/* ---- Published Upload ---- */}
            {publishedUpload && (
              <div
                className="rounded-xl border"
                style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
              >
                <div
                  className="flex items-center gap-2.5 px-6 py-4 border-b"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  <Upload className="w-[18px] h-[18px]" style={{ color: 'var(--text-muted)' }} />
                  <h3
                    className="text-[15px] font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Published Upload
                  </h3>
                </div>
                <div className="px-6 py-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                    <InfoField label="File Name" value={publishedUpload.originalFileName} />
                    <InfoField label="Content Type" value={publishedUpload.contentType} />
                    <InfoField label="Size" value={formatFileSize(publishedUpload.sizeBytes)} />
                    <InfoField
                      label="Scope"
                      value={
                        <Badge
                          variant={publishedUpload.scope === 'FINAL' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {formatEnumLabel(publishedUpload.scope)}
                        </Badge>
                      }
                    />
                    <InfoField
                      label="Status"
                      value={
                        <Badge variant="secondary" className="text-xs">
                          {formatStatusLabel(publishedUpload.status)}
                        </Badge>
                      }
                    />
                    <InfoField
                      label="Uploaded"
                      value={formatDate(
                        publishedUpload.uploadedAt || publishedUpload.createdAt || null
                      )}
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ================ UPLOADS TAB ================ */}
          <TabsContent value="uploads" className="mt-0">
            <div
              className="rounded-xl border"
              style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <div className="flex items-center gap-2.5">
                  <Upload className="w-[18px] h-[18px]" style={{ color: 'var(--text-muted)' }} />
                  <h3
                    className="text-[15px] font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Dataset Uploads
                  </h3>
                  {(uploadsData?.pagination?.total ?? uploads.length) > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {uploadsData?.pagination?.total ?? uploads.length}
                    </Badge>
                  )}
                </div>
                {canUpdateDataset ? (
                  <Button
                    size="sm"
                    onClick={() => setUploadDialogOpen(true)}
                    className="h-8 text-xs"
                    style={{
                      backgroundColor: 'var(--brand-primary)',
                      color: 'var(--brand-on-primary)',
                    }}
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Upload File
                  </Button>
                ) : null}
              </div>

              {/* Filters */}
              <div
                className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:px-6"
                style={{
                  borderColor: 'var(--border-default)',
                  backgroundColor: 'var(--bg-surface)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    Scope:
                  </span>
                  <Select
                    value={uploadScopeFilter}
                    onValueChange={(v) => setUploadScopeFilter(v as UploadScope | 'ALL')}
                  >
                    <SelectTrigger
                      aria-label="Filter uploads by scope"
                      className="h-7 w-[140px] text-xs"
                    >
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
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    Status:
                  </span>
                  <Select
                    value={uploadStatusFilter}
                    onValueChange={(v) => setUploadStatusFilter(v as UploadStatus | 'ALL')}
                  >
                    <SelectTrigger
                      aria-label="Filter uploads by status"
                      className="h-7 w-[140px] text-xs"
                    >
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
              <div className="px-4 py-4 sm:px-6">
                {uploadsError ? (
                  <div className="py-10 text-center">
                    <AlertCircle
                      className="mx-auto h-8 w-8"
                      style={{ color: 'var(--state-error)' }}
                      aria-hidden="true"
                    />
                    <p className="mt-3 text-sm font-medium">Could not load dataset uploads</p>
                    <Button className="mt-4" variant="outline" onClick={() => refetchUploads()}>
                      Retry
                    </Button>
                  </div>
                ) : uploads.length > 0 ? (
                  <div className="space-y-3">
                    {uploads.map((upload) => (
                      <div
                        key={upload.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                        style={{
                          borderColor: 'var(--border-default)',
                          backgroundColor: 'var(--bg-surface)',
                        }}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                            style={{ backgroundColor: 'var(--bg-base)' }}
                          >
                            <FileText className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {upload.originalFileName || 'Unnamed Upload'}
                            </p>
                            <div
                              className="flex items-center gap-2 mt-0.5 text-xs"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <span>{formatFileSize(upload.sizeBytes)}</span>
                              <span>&middot;</span>
                              <span>{formatDateShort(upload.createdAt ?? null)}</span>
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
                          <Badge
                            variant={upload.scope === 'FINAL' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {formatEnumLabel(upload.scope)}
                          </Badge>
                          <Badge
                            variant={
                              upload.status === 'UPLOADED'
                                ? 'secondary'
                                : upload.status === 'PROMOTED'
                                  ? 'default'
                                  : upload.status === 'FAILED'
                                    ? 'destructive'
                                    : 'outline'
                            }
                            className="text-xs"
                          >
                            {formatStatusLabel(upload.status)}
                          </Badge>
                          {(upload.status === 'UPLOADED' || upload.status === 'PROMOTED') && (
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
                    <Upload
                      className="w-10 h-10 mx-auto mb-3"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <p
                      className="font-medium text-sm mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      No uploads yet
                    </p>
                    <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                      {uploadScopeFilter !== 'ALL' || uploadStatusFilter !== 'ALL'
                        ? 'No uploads match the current filters'
                        : 'Upload a file to get started with this dataset'}
                    </p>
                    {canUpdateDataset &&
                      uploadScopeFilter === 'ALL' &&
                      uploadStatusFilter === 'ALL' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUploadDialogOpen(true)}
                          className="h-8 text-xs"
                        >
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
            <DatasetKdtsView datasetId={datasetId} canEdit={canEditMetadata} />
          </TabsContent>

          {/* ================ AUDIT LOG TAB ================ */}
          <TabsContent value="audit" className="mt-0">
            <DatasetAuditLog datasetId={datasetId} />
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

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeleteReason('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive dataset</DialogTitle>
            <DialogDescription>
              Archive <strong>{dataset.title}</strong>? It will be removed from active marketplace
              workflows. Datasets with purchases cannot be archived.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="archive-reason">Reason</Label>
            <Textarea
              id="archive-reason"
              value={deleteReason}
              maxLength={1000}
              placeholder="Explain why this dataset is being archived."
              onChange={(event) => setDeleteReason(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteDatasetMutation.isPending || deleteReason.trim().length < 3}
            >
              {deleteDatasetMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Archive dataset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Dataset</DialogTitle>
            <DialogDescription>
              Publishing <strong>{dataset.title}</strong> will make it available to users based on
              its visibility settings ({formatEnumLabel(dataset.visibility)}). A final upload,
              complete required metadata, at least one feature, and a current KDTS assessment with a
              Legal &amp; Compliance score of 60 or higher are required.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishDatasetMutation.isPending}
              style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-on-primary)' }}
            >
              {publishDatasetMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={unpublishDialogOpen}
        onOpenChange={(open) => {
          setUnpublishDialogOpen(open);
          if (!open) setUnpublishReason('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unpublish Dataset</DialogTitle>
            <DialogDescription>
              Unpublishing <strong>{dataset.title}</strong> will remove it from public access. Its
              status will revert to Verified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="unpublish-reason">Reason</Label>
            <Textarea
              id="unpublish-reason"
              value={unpublishReason}
              maxLength={1000}
              placeholder="Explain why this dataset is being unpublished."
              onChange={(event) => setUnpublishReason(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnpublishDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUnpublish}
              disabled={unpublishDatasetMutation.isPending || unpublishReason.trim().length < 3}
            >
              {unpublishDatasetMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Unpublish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
