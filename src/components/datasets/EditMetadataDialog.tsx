"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import type { UpdateDatasetMetadataRequest } from "@/types/dataset.types";

interface EditMetadataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: UpdateDatasetMetadataRequest) => Promise<void>;
  initialData: {
    aboutDatasetInfo?: {
      overview: string;
      description: string;
      dataQuality: string;
      useCases?: string | null;
      limitations?: string | null;
      methodology?: string | null;
    };
    dataFormatInfo?: {
      fileFormat: string;
      rows: number;
      cols: number;
      fileSize: string;
      compressionType: string;
      encoding: string;
    };
    locationInfo?: {
      country: string;
      state?: string | null;
      city?: string | null;
      region?: string | null;
      coordinates?: string | null;
      coverage?: string | null;
    };
    tags?: Array<{ id: string; name: string; slug: string }>;
  };
}

export function EditMetadataDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
}: EditMetadataDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // About Dataset Info
  const [overview, setOverview] = useState(initialData.aboutDatasetInfo?.overview || "");
  const [description, setDescription] = useState(initialData.aboutDatasetInfo?.description || "");
  const [dataQuality, setDataQuality] = useState(initialData.aboutDatasetInfo?.dataQuality || "");
  const [useCases, setUseCases] = useState(initialData.aboutDatasetInfo?.useCases || "");
  const [limitations, setLimitations] = useState(initialData.aboutDatasetInfo?.limitations || "");
  const [methodology, setMethodology] = useState(initialData.aboutDatasetInfo?.methodology || "");

  // Location Info
  const [country, setCountry] = useState(initialData.locationInfo?.country || "");
  const [state, setState] = useState(initialData.locationInfo?.state || "");
  const [city, setCity] = useState(initialData.locationInfo?.city || "");
  const [region, setRegion] = useState(initialData.locationInfo?.region || "");
  const [coordinates, setCoordinates] = useState(initialData.locationInfo?.coordinates || "");
  const [coverage, setCoverage] = useState(initialData.locationInfo?.coverage || "");

  // Data Format Info
  const [fileFormat, setFileFormat] = useState(initialData.dataFormatInfo?.fileFormat || "");
  const [compressionType, setCompressionType] = useState(initialData.dataFormatInfo?.compressionType || "");
  const [encoding, setEncoding] = useState(initialData.dataFormatInfo?.encoding || "");

  // Tags
  const [tagsInput, setTagsInput] = useState(
    initialData.tags?.map((t) => t.name).join(", ") || ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updateData: UpdateDatasetMetadataRequest = {
        aboutDatasetInfo: {
          overview: overview || undefined,
          description: description || undefined,
          dataQuality: dataQuality || undefined,
          useCases: useCases || null,
          limitations: limitations || null,
          methodology: methodology || null,
        },
        locationInfo: {
          country: country || undefined,
          state: state || null,
          city: city || null,
          region: region || null,
          coordinates: coordinates || null,
          coverage: coverage || null,
        },
        dataFormatInfo: {
          fileFormat: fileFormat || undefined,
          compressionType: compressionType || undefined,
          encoding: encoding || undefined,
        },
        tags: tagsInput
          ? tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean)
          : undefined,
      };

      await onSave(updateData);
      onOpenChange(false);
    } catch {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Dataset Metadata</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* About Dataset Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">About Dataset</h3>

              <div>
                <Label htmlFor="overview">Overview *</Label>
                <Textarea
                  id="overview"
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  placeholder="Brief overview of the dataset"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description"
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="dataQuality">Data Quality *</Label>
                <Textarea
                  id="dataQuality"
                  value={dataQuality}
                  onChange={(e) => setDataQuality(e.target.value)}
                  placeholder="Information about data quality"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="useCases">Use Cases</Label>
                <Textarea
                  id="useCases"
                  value={useCases}
                  onChange={(e) => setUseCases(e.target.value)}
                  placeholder="Potential use cases"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="limitations">Limitations</Label>
                <Textarea
                  id="limitations"
                  value={limitations}
                  onChange={(e) => setLimitations(e.target.value)}
                  placeholder="Known limitations"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="methodology">Methodology</Label>
                <Textarea
                  id="methodology"
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                  placeholder="Data collection methodology"
                  rows={3}
                />
              </div>
            </div>

            {/* Location Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Location Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country"
                  />
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Region"
                  />
                </div>

                <div>
                  <Label htmlFor="coordinates">Coordinates</Label>
                  <Input
                    id="coordinates"
                    value={coordinates}
                    onChange={(e) => setCoordinates(e.target.value)}
                    placeholder="Lat, Long"
                  />
                </div>

                <div>
                  <Label htmlFor="coverage">Coverage</Label>
                  <Input
                    id="coverage"
                    value={coverage}
                    onChange={(e) => setCoverage(e.target.value)}
                    placeholder="Geographic coverage"
                  />
                </div>
              </div>
            </div>

            {/* Data Format Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Data Format</h3>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="fileFormat">File Format</Label>
                  <Input
                    id="fileFormat"
                    value={fileFormat}
                    onChange={(e) => setFileFormat(e.target.value)}
                    placeholder="e.g., CSV, JSON"
                  />
                </div>

                <div>
                  <Label htmlFor="compressionType">Compression</Label>
                  <Input
                    id="compressionType"
                    value={compressionType}
                    onChange={(e) => setCompressionType(e.target.value)}
                    placeholder="e.g., GZIP, None"
                  />
                </div>

                <div>
                  <Label htmlFor="encoding">Encoding</Label>
                  <Input
                    id="encoding"
                    value={encoding}
                    onChange={(e) => setEncoding(e.target.value)}
                    placeholder="e.g., UTF-8"
                  />
                </div>
              </div>
            </div>

            {/* Tags Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Tags</h3>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g., finance, healthcare, analytics"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate tags with commas
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
