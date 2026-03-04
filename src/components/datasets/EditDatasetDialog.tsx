"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useCategories } from "@/hooks/api/useCategories";
import { useSources } from "@/hooks/api/useSources";
import type { UpdateDatasetRequest, DatasetVisibility, DatasetSuperType, Currency } from "@/types/dataset.types";

interface EditDatasetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: UpdateDatasetRequest) => Promise<void>;
  initialData: {
    title: string;
    visibility: DatasetVisibility;
    superType: DatasetSuperType;
    primaryCategoryId: string;
    sourceId: string;
    isPaid: boolean;
    price: string | null;
    currency: Currency;
    license: string;
  };
}

export function EditDatasetDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
}: EditDatasetDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState(initialData.title);
  const [visibility, setVisibility] = useState(initialData.visibility);
  const [superType, setSuperType] = useState(initialData.superType);
  const [categoryId, setCategoryId] = useState(initialData.primaryCategoryId);
  const [sourceId, setSourceId] = useState(initialData.sourceId);
  const [isPaid, setIsPaid] = useState(initialData.isPaid);
  const [price, setPrice] = useState(initialData.price || "");
  const [currency, setCurrency] = useState(initialData.currency);
  const [license, setLicense] = useState(initialData.license);

  // Fetch categories and sources
  const { data: categoriesData } = useCategories();
  const { data: sourcesData } = useSources();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle(initialData.title);
      setVisibility(initialData.visibility);
      setSuperType(initialData.superType);
      setCategoryId(initialData.primaryCategoryId);
      setSourceId(initialData.sourceId);
      setIsPaid(initialData.isPaid);
      setPrice(initialData.price || "");
      setCurrency(initialData.currency);
      setLicense(initialData.license);
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updateData: UpdateDatasetRequest = {
        title,
        visibility,
        superType,
        primaryCategoryId: categoryId,
        sourceId,
        isPaid,
        price: isPaid ? price : null,
        currency,
        license,
      };

      await onSave(updateData);
      onOpenChange(false);
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const superTypeOptions = [
    { value: 'CROSS_SECTIONAL', label: 'Cross Sectional' },
    { value: 'TIME_SERIES', label: 'Time Series' },
    { value: 'PANEL', label: 'Panel' },
    { value: 'POOLED_CROSS_SECTIONAL', label: 'Pooled Cross Sectional' },
    { value: 'REPEATED_CROSS_SECTIONS', label: 'Repeated Cross Sections' },
    { value: 'SPATIAL', label: 'Spatial' },
    { value: 'SPATIO_TEMPORAL', label: 'Spatio Temporal' },
    { value: 'EXPERIMENTAL', label: 'Experimental' },
    { value: 'OBSERVATIONAL', label: 'Observational' },
    { value: 'BIG_DATA', label: 'Big Data' },
    { value: 'EVENT_HISTORY_SURVIVAL', label: 'Event History Survival' },
    { value: 'HIERARCHICAL_MULTILEVEL', label: 'Hierarchical Multilevel' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Dataset</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Dataset Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter dataset title"
              required
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility *</Label>
            <Select value={visibility} onValueChange={(value) => setVisibility(value as DatasetVisibility)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="PRIVATE">Private</SelectItem>
                <SelectItem value="UNLISTED">Unlisted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Super Type */}
          <div className="space-y-2">
            <Label htmlFor="superType">Super Type *</Label>
            <Select value={superType} onValueChange={(value) => setSuperType(value as DatasetSuperType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {superTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Primary Category *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoriesData?.items?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Source *</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sourcesData?.items?.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* License */}
          <div className="space-y-2">
            <Label htmlFor="license">License *</Label>
            <Input
              id="license"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              placeholder="e.g., MIT, Apache 2.0, CC BY 4.0"
              required
            />
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="isPaid">Paid Dataset</Label>
              <Switch
                id="isPaid"
                checked={isPaid}
                onCheckedChange={setIsPaid}
              />
            </div>

            {isPaid && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    required={isPaid}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency *</Label>
                  <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
                    <SelectTrigger>
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
