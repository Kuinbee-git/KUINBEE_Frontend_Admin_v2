"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useCreateDataset } from "@/hooks/api/useDatasets";
import { useCategories } from "@/hooks/api/useCategories";
import { useSources } from "@/hooks/api/useSources";
import { useMyPermissions } from "@/hooks/api/useAuth";
import { toast } from "sonner";
import type { DatasetVisibility, Currency, CreateDatasetRequest } from "@/types";

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
}

export function CreateDatasetView() {
  const router = useRouter();
  const createDatasetMutation = useCreateDataset();
  
  // Fetch categories and sources for dropdowns
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: sourcesData, isLoading: sourcesLoading } = useSources();
  
  // Permissions
  const { data: permissionsData } = useMyPermissions();
  const canCreate = permissionsData?.includes('CREATE_PLATFORM_DATASET') ?? true;
  
  // Form state - Basic Info
  const [title, setTitle] = useState("");
  const [superType, setSuperType] = useState("STRUCTURED");
  const [primaryCategoryId, setPrimaryCategoryId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [visibility, setVisibility] = useState<DatasetVisibility>("PRIVATE");
  const [license, setLicense] = useState("");
  
  // Pricing
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<Currency>("INR");
  
  // About Dataset
  const [overview, setOverview] = useState("");
  const [description, setDescription] = useState("");
  const [dataQuality, setDataQuality] = useState("");
  const [useCases, setUseCases] = useState("");
  const [limitations, setLimitations] = useState("");
  const [methodology, setMethodology] = useState("");
  
  // Location Info
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [coverage, setCoverage] = useState("");
  
  // Form errors
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const categories = categoriesData?.items || [];
  const sources = sourcesData?.items || [];

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!primaryCategoryId) {
      newErrors.primaryCategoryId = "Category is required";
    }
    if (!sourceId) {
      newErrors.sourceId = "Source is required";
    }
    if (!superType) {
      newErrors.superType = "Dataset type is required";
    }
    if (!license.trim()) {
      newErrors.license = "License is required";
    }
    if (!overview.trim()) {
      newErrors.overview = "Overview is required";
    }
    if (!description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!dataQuality.trim()) {
      newErrors.dataQuality = "Data quality information is required";
    }
    if (isPaid && (!price || parseFloat(price) <= 0)) {
      newErrors.price = "Valid price is required for paid datasets";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, primaryCategoryId, sourceId, superType, license, overview, description, dataQuality, isPaid, price]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
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
      isPaid,
      price: isPaid ? price : null,
      currency: isPaid ? currency : undefined,
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
      toast.success("Dataset created successfully");
      router.push(`/dashboard/datasets/${dataset.datasetUniqueId}`);
    } catch {
      toast.error("Failed to create dataset");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validateForm, title, visibility, superType, primaryCategoryId, sourceId,
    license, isPaid, price, currency, overview, description, dataQuality,
    useCases, limitations, methodology, country, state, city, coverage,
    createDatasetMutation, router
  ]);

  const handleBack = useCallback(() => {
    router.push("/dashboard/datasets");
  }, [router]);

  if (!canCreate) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-surface)" }}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--state-error)" }} />
          <h2 className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
            Access Denied
          </h2>
          <p className="mt-2" style={{ color: "var(--text-muted)" }}>
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
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-surface)" }}>
      {/* Page Header */}
      <div
        className="p-6 border-b"
        style={{
          backgroundColor: "var(--bg-base)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                Create Platform Dataset
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                Create a new platform-owned dataset
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                backgroundColor: "var(--brand-primary)",
                color: "#ffffff",
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Creating..." : "Create Dataset"}
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Basic Information */}
        <Card style={{ backgroundColor: "var(--bg-base)" }}>
          <CardHeader>
            <CardTitle style={{ color: "var(--text-primary)" }}>Basic Information</CardTitle>
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
                style={{
                  borderColor: errors.title ? "var(--state-error)" : undefined,
                }}
              />
              {errors.title && (
                <p className="text-xs mt-1" style={{ color: "var(--state-error)" }}>
                  {errors.title}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="superType">Dataset Type *</Label>
                <Select value={superType} onValueChange={setSuperType}>
                  <SelectTrigger className="mt-1.5" style={{ borderColor: errors.superType ? "var(--state-error)" : undefined }}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STRUCTURED">Structured Data</SelectItem>
                    <SelectItem value="UNSTRUCTURED">Unstructured Data</SelectItem>
                    <SelectItem value="SEMI_STRUCTURED">Semi-structured Data</SelectItem>
                    <SelectItem value="TIME_SERIES">Time Series</SelectItem>
                    <SelectItem value="GEOSPATIAL">Geospatial</SelectItem>
                  </SelectContent>
                </Select>
                {errors.superType && (
                  <p className="text-xs mt-1" style={{ color: "var(--state-error)" }}>
                    {errors.superType}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={visibility} onValueChange={(v) => setVisibility(v as DatasetVisibility)}>
                  <SelectTrigger className="mt-1.5">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={primaryCategoryId} onValueChange={setPrimaryCategoryId}>
                  <SelectTrigger 
                    className="mt-1.5" 
                    disabled={categoriesLoading}
                    style={{ borderColor: errors.primaryCategoryId ? "var(--state-error)" : undefined }}
                  >
                    <SelectValue placeholder={categoriesLoading ? "Loading..." : "Select category"} />
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
                  <p className="text-xs mt-1" style={{ color: "var(--state-error)" }}>
                    {errors.primaryCategoryId}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="source">Source *</Label>
                <Select value={sourceId} onValueChange={setSourceId}>
                  <SelectTrigger 
                    className="mt-1.5" 
                    disabled={sourcesLoading}
                    style={{ borderColor: errors.sourceId ? "var(--state-error)" : undefined }}
                  >
                    <SelectValue placeholder={sourcesLoading ? "Loading..." : "Select source"} />
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
                  <p className="text-xs mt-1" style={{ color: "var(--state-error)" }}>
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
                style={{
                  borderColor: errors.license ? "var(--state-error)" : undefined,
                }}
              />
              {errors.license && (
                <p className="text-xs mt-1" style={{ color: "var(--state-error)" }}>
                  {errors.license}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card style={{ backgroundColor: "var(--bg-base)" }}>
          <CardHeader>
            <CardTitle style={{ color: "var(--text-primary)" }}>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Paid Dataset</Label>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Enable to set a price for this dataset
                </p>
              </div>
              <Switch checked={isPaid} onCheckedChange={setIsPaid} />
            </div>

            {isPaid && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="mt-1.5"
                    style={{
                      borderColor: errors.price ? "var(--state-error)" : undefined,
                    }}
                  />
                  {errors.price && (
                    <p className="text-xs mt-1" style={{ color: "var(--state-error)" }}>
                      {errors.price}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                    <SelectTrigger className="mt-1.5">
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
        <Card style={{ backgroundColor: "var(--bg-base)" }}>
          <CardHeader>
            <CardTitle style={{ color: "var(--text-primary)" }}>About Dataset</CardTitle>
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
                style={{
                  borderColor: errors.overview ? "var(--state-error)" : undefined,
                }}
              />
              {errors.overview && (
                <p className="text-xs mt-1" style={{ color: "var(--state-error)" }}>
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
                style={{
                  borderColor: errors.description ? "var(--state-error)" : undefined,
                }}
              />
              {errors.description && (
                <p className="text-xs mt-1" style={{ color: "var(--state-error)" }}>
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
                style={{
                  borderColor: errors.dataQuality ? "var(--state-error)" : undefined,
                }}
              />
              {errors.dataQuality && (
                <p className="text-xs mt-1" style={{ color: "var(--state-error)" }}>
                  {errors.dataQuality}
                </p>
              )}
            </div>

            <Separator style={{ backgroundColor: "var(--border-default)" }} />

            <div>
              <Label htmlFor="useCases">Use Cases (Optional)</Label>
              <Textarea
                id="useCases"
                value={useCases}
                onChange={(e) => setUseCases(e.target.value)}
                placeholder="Potential use cases and applications for this dataset"
                className="mt-1.5 min-h-[80px]"
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
              />
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card style={{ backgroundColor: "var(--bg-base)" }}>
          <CardHeader>
            <CardTitle style={{ color: "var(--text-primary)" }}>Location Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country of data origin"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State or province"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="mt-1.5"
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
            disabled={isSubmitting}
            style={{
              backgroundColor: "var(--brand-primary)",
              color: "#ffffff",
            }}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Creating..." : "Create Dataset"}
          </Button>
        </div>
      </div>
    </div>
  );
}
