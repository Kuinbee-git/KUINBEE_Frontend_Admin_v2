'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useCreateDataset } from '@/hooks/api/useDatasets';
import { useCategories } from '@/hooks/api/useCategories';
import { useSources } from '@/hooks/api/useSources';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { toast } from 'sonner';
import type { DatasetVisibility, Currency, CreateDatasetRequest, DatasetSuperType } from '@/types';

interface FormErrors {
  title?: string;
  primaryCategoryId?: string;
  sourceId?: string;
  superType?: string;
  license?: string;
  overview?: string;
  description?: string;
  dataQuality?: string;
  price?: string;
  country?: string;
}

export function CreateDatasetView() {
  const router = useRouter();
  const createDatasetMutation = useCreateDataset();

  // Fetch categories and sources for dropdowns
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useCategories({
    pageSize: 200,
    sort: 'name:asc',
  });
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

  // Permissions
  const { can } = useAuthorization();
  const canCreate = can({ anyOf: [PERMISSIONS.DATASETS.CREATE_PLATFORM] });

  // Form state - Basic Info
  const [title, setTitle] = useState('');
  const [superType, setSuperType] = useState<DatasetSuperType>('CROSS_SECTIONAL');
  const [primaryCategoryId, setPrimaryCategoryId] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [visibility, setVisibility] = useState<DatasetVisibility>('PRIVATE');
  const [license, setLicense] = useState('');

  // Pricing
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<Currency>('INR');

  // About Dataset
  const [overview, setOverview] = useState('');
  const [description, setDescription] = useState('');
  const [dataQuality, setDataQuality] = useState('');
  const [useCases, setUseCases] = useState('');
  const [limitations, setLimitations] = useState('');
  const [methodology, setMethodology] = useState('');

  // Location Info
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [coverage, setCoverage] = useState('');

  // Form errors
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = categoriesData?.items || [];
  const sources = sourcesData?.items || [];
  const referenceDataLoading = categoriesLoading || sourcesLoading;
  const referenceDataError = categoriesError || sourcesError;
  const referenceDataReady =
    !referenceDataLoading && !referenceDataError && categories.length > 0 && sources.length > 0;

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!primaryCategoryId) {
      newErrors.primaryCategoryId = 'Category is required';
    }
    if (!sourceId) {
      newErrors.sourceId = 'Source is required';
    }
    if (!superType) {
      newErrors.superType = 'Dataset type is required';
    }
    if (!license.trim()) {
      newErrors.license = 'License is required';
    }
    if (!overview.trim()) {
      newErrors.overview = 'Overview is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!dataQuality.trim()) {
      newErrors.dataQuality = 'Data quality information is required';
    }
    const normalizedPrice = price.trim();
    if (isPaid && (!/^\d+(?:\.\d+)?$/.test(normalizedPrice) || Number(normalizedPrice) <= 0)) {
      newErrors.price = 'Valid price is required for paid datasets';
    }
    if (!country.trim()) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    title,
    primaryCategoryId,
    sourceId,
    superType,
    license,
    overview,
    description,
    dataQuality,
    isPaid,
    price,
    country,
  ]);

  const handleSubmit = useCallback(async () => {
    if (!referenceDataReady) {
      toast.error('Categories and sources must load before a dataset can be created');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    const data: CreateDatasetRequest = {
      title: title.trim(),
      visibility,
      superType,
      primaryCategoryId,
      sourceId,
      license: license.trim(),
      pricing: {
        isPaid,
        price: isPaid ? price.trim() : null,
        currency,
      },
      aboutDatasetInfo: {
        overview: overview.trim(),
        description: description.trim(),
        dataQuality: dataQuality.trim(),
        useCases: useCases.trim() || null,
        limitations: limitations.trim() || null,
        methodology: methodology.trim() || null,
      },
      locationInfo: {
        country: country.trim(),
        state: state.trim() || null,
        city: city.trim() || null,
        coverage: coverage.trim() || null,
      },
    };

    try {
      const dataset = await createDatasetMutation.mutateAsync(data);
      // Toast is handled by the hook
      router.push(`/dashboard/platform-datasets/${dataset.id}`);
    } catch {
      // Error toast is handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validateForm,
    title,
    visibility,
    superType,
    primaryCategoryId,
    sourceId,
    license,
    isPaid,
    price,
    currency,
    overview,
    description,
    dataQuality,
    useCases,
    limitations,
    methodology,
    country,
    state,
    city,
    coverage,
    createDatasetMutation,
    router,
    referenceDataReady,
  ]);

  const handleBack = useCallback(() => {
    router.push('/dashboard/datasets');
  }, [router]);

  if (!canCreate) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--state-error)' }} />
          <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            Access Denied
          </h2>
          <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
            You don&apos;t have permission to create datasets.
          </p>
          <Button variant="outline" className="mt-4" onClick={handleBack}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      {/* Page Header */}
      <div
        className="border-b p-4 sm:p-6"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Back to datasets">
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Create Platform Dataset
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                Create a new platform-owned dataset
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 sm:justify-end">
            <Button variant="outline" onClick={handleBack}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !referenceDataReady}
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: 'var(--brand-on-primary)',
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create Dataset'}
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        {referenceDataError || (!referenceDataLoading && !referenceDataReady) ? (
          <div
            className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
            style={{
              backgroundColor: 'var(--status-error-bg)',
              borderColor: 'var(--status-error-border)',
              color: 'var(--status-error)',
            }}
          >
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>
                {referenceDataError
                  ? 'Categories or platform sources could not be loaded. Creation is disabled until the lookup data is available.'
                  : 'At least one category and one platform source are required before a dataset can be created.'}
              </span>
            </div>
            {referenceDataError ? (
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
            ) : null}
          </div>
        ) : null}
        {/* Basic Information */}
        <Card style={{ backgroundColor: 'var(--bg-base)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--text-primary)' }}>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Dataset Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title for your dataset"
                className="mt-1.5"
                maxLength={200}
                style={{
                  borderColor: errors.title ? 'var(--state-error)' : undefined,
                }}
              />
              {errors.title && (
                <p className="text-xs mt-1" style={{ color: 'var(--state-error)' }}>
                  {errors.title}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="superType">Dataset Type *</Label>
                <Select
                  value={superType}
                  onValueChange={(v) => setSuperType(v as DatasetSuperType)}
                >
                  <SelectTrigger
                    id="superType"
                    className="mt-1.5"
                    style={{ borderColor: errors.superType ? 'var(--state-error)' : undefined }}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CROSS_SECTIONAL">Cross-Sectional</SelectItem>
                    <SelectItem value="TIME_SERIES">Time Series</SelectItem>
                    <SelectItem value="PANEL">Panel</SelectItem>
                    <SelectItem value="POOLED_CROSS_SECTIONAL">Pooled Cross-Sectional</SelectItem>
                    <SelectItem value="REPEATED_CROSS_SECTIONS">Repeated Cross-Sections</SelectItem>
                    <SelectItem value="SPATIAL">Spatial</SelectItem>
                    <SelectItem value="SPATIO_TEMPORAL">Spatio-Temporal</SelectItem>
                    <SelectItem value="EXPERIMENTAL">Experimental</SelectItem>
                    <SelectItem value="OBSERVATIONAL">Observational</SelectItem>
                    <SelectItem value="BIG_DATA">Big Data</SelectItem>
                    <SelectItem value="EVENT_HISTORY_SURVIVAL">Event History / Survival</SelectItem>
                    <SelectItem value="HIERARCHICAL_MULTILEVEL">
                      Hierarchical / Multilevel
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.superType && (
                  <p className="text-xs mt-1" style={{ color: 'var(--state-error)' }}>
                    {errors.superType}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={visibility}
                  onValueChange={(v) => setVisibility(v as DatasetVisibility)}
                >
                  <SelectTrigger id="visibility" className="mt-1.5">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                    <SelectItem value="UNLISTED">Unlisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={primaryCategoryId} onValueChange={setPrimaryCategoryId}>
                  <SelectTrigger
                    className="mt-1.5"
                    id="category"
                    disabled={categoriesLoading || categoriesError || categories.length === 0}
                    style={{
                      borderColor: errors.primaryCategoryId ? 'var(--state-error)' : undefined,
                    }}
                  >
                    <SelectValue
                      placeholder={categoriesLoading ? 'Loading...' : 'Select category'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.primaryCategoryId && (
                  <p className="text-xs mt-1" style={{ color: 'var(--state-error)' }}>
                    {errors.primaryCategoryId}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="source">Source *</Label>
                <Select value={sourceId} onValueChange={setSourceId}>
                  <SelectTrigger
                    className="mt-1.5"
                    id="source"
                    disabled={sourcesLoading || sourcesError || sources.length === 0}
                    style={{ borderColor: errors.sourceId ? 'var(--state-error)' : undefined }}
                  >
                    <SelectValue placeholder={sourcesLoading ? 'Loading...' : 'Select source'} />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((src) => (
                      <SelectItem key={src.id} value={src.id}>
                        {src.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sourceId && (
                  <p className="text-xs mt-1" style={{ color: 'var(--state-error)' }}>
                    {errors.sourceId}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="license">License *</Label>
              <Input
                id="license"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="e.g., MIT, Apache 2.0, CC BY 4.0, Proprietary"
                className="mt-1.5"
                maxLength={200}
                style={{
                  borderColor: errors.license ? 'var(--state-error)' : undefined,
                }}
              />
              {errors.license && (
                <p className="text-xs mt-1" style={{ color: 'var(--state-error)' }}>
                  {errors.license}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card style={{ backgroundColor: 'var(--bg-base)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--text-primary)' }}>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isPaid">Paid Dataset</Label>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Enable to set a price for this dataset
                </p>
              </div>
              <Switch id="isPaid" checked={isPaid} onCheckedChange={setIsPaid} />
            </div>

            {isPaid && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="mt-1.5"
                    style={{
                      borderColor: errors.price ? 'var(--state-error)' : undefined,
                    }}
                  />
                  {errors.price && (
                    <p className="text-xs mt-1" style={{ color: 'var(--state-error)' }}>
                      {errors.price}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                    <SelectTrigger id="currency" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* About Dataset */}
        <Card style={{ backgroundColor: 'var(--bg-base)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--text-primary)' }}>About Dataset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="overview">Overview *</Label>
              <Textarea
                id="overview"
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                placeholder="Brief summary of what this dataset contains"
                className="mt-1.5 min-h-[80px]"
                maxLength={20000}
                style={{
                  borderColor: errors.overview ? 'var(--state-error)' : undefined,
                }}
              />
              {errors.overview && (
                <p className="text-xs mt-1" style={{ color: 'var(--state-error)' }}>
                  {errors.overview}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of the dataset, its contents, and structure"
                className="mt-1.5 min-h-[120px]"
                maxLength={20000}
                style={{
                  borderColor: errors.description ? 'var(--state-error)' : undefined,
                }}
              />
              {errors.description && (
                <p className="text-xs mt-1" style={{ color: 'var(--state-error)' }}>
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="dataQuality">Data Quality *</Label>
              <Textarea
                id="dataQuality"
                value={dataQuality}
                onChange={(e) => setDataQuality(e.target.value)}
                placeholder="Information about data quality, completeness, and accuracy"
                className="mt-1.5 min-h-[80px]"
                maxLength={20000}
                style={{
                  borderColor: errors.dataQuality ? 'var(--state-error)' : undefined,
                }}
              />
              {errors.dataQuality && (
                <p className="text-xs mt-1" style={{ color: 'var(--state-error)' }}>
                  {errors.dataQuality}
                </p>
              )}
            </div>

            <Separator style={{ backgroundColor: 'var(--border-default)' }} />

            <div>
              <Label htmlFor="useCases">Use Cases (Optional)</Label>
              <Textarea
                id="useCases"
                value={useCases}
                onChange={(e) => setUseCases(e.target.value)}
                placeholder="Potential use cases and applications for this dataset"
                className="mt-1.5 min-h-[80px]"
                maxLength={20000}
              />
            </div>

            <div>
              <Label htmlFor="limitations">Limitations (Optional)</Label>
              <Textarea
                id="limitations"
                value={limitations}
                onChange={(e) => setLimitations(e.target.value)}
                placeholder="Known limitations, biases, or constraints of the dataset"
                className="mt-1.5 min-h-[80px]"
                maxLength={20000}
              />
            </div>

            <div>
              <Label htmlFor="methodology">Methodology (Optional)</Label>
              <Textarea
                id="methodology"
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
                placeholder="How the data was collected, processed, or generated"
                className="mt-1.5 min-h-[80px]"
                maxLength={20000}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card style={{ backgroundColor: 'var(--bg-base)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--text-primary)' }}>Location Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country of data origin"
                  className="mt-1.5"
                  maxLength={200}
                  aria-invalid={Boolean(errors.country)}
                  style={{ borderColor: errors.country ? 'var(--state-error)' : undefined }}
                />
                {errors.country ? (
                  <p className="mt-1 text-xs" style={{ color: 'var(--state-error)' }}>
                    {errors.country}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State or province"
                  className="mt-1.5"
                  maxLength={200}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="mt-1.5"
                  maxLength={200}
                />
              </div>
              <div>
                <Label htmlFor="coverage">Coverage</Label>
                <Input
                  id="coverage"
                  value={coverage}
                  onChange={(e) => setCoverage(e.target.value)}
                  placeholder="e.g., National, Regional, Global"
                  className="mt-1.5"
                  maxLength={1000}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button at Bottom */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={handleBack}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !referenceDataReady}
            style={{
              backgroundColor: 'var(--brand-primary)',
              color: 'var(--brand-on-primary)',
            }}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Creating...' : 'Create Dataset'}
          </Button>
        </div>
      </div>
    </div>
  );
}
