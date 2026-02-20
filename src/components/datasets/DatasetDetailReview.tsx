"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge, getDatasetStatusSemantic, getVerificationStatusSemantic } from "@/components/shared/StatusBadge";
import { ReviewActions } from "./ReviewActions";
import { PricingReviewCard } from "./PricingReviewCard";
import { useProposalReview, usePickProposal, useApproveProposal, useRejectProposal, useRequestChanges, useRequestPricingChanges, useDownloadProposalUrl } from "@/hooks/api/useDatasets";
import { useMyPermissions } from "@/hooks/api/useAuth";
import { toast } from "sonner";

interface DatasetDetailReviewProps {
  datasetId: string;
}

export function DatasetDetailReview({ datasetId }: DatasetDetailReviewProps) {
  const router = useRouter();
  
  // Fetch dataset proposal review details
  const { data: datasetData, isLoading, refetch } = useProposalReview(datasetId);
  
  // Proposal mutations
  const pickProposalMutation = usePickProposal();
  const approveProposalMutation = useApproveProposal();
  const rejectProposalMutation = useRejectProposal();
  const requestChangesMutation = useRequestChanges();
  const requestPricingChangesMutation = useRequestPricingChanges();
  const downloadUrlMutation = useDownloadProposalUrl();
  
  // Permissions
  const { data: permissionsData } = useMyPermissions();
  
  const canApprove = permissionsData?.includes('APPROVE_DATASET') ?? false;
  const canReject = permissionsData?.includes('REJECT_DATASET') ?? false;
  const canRequestChanges = permissionsData?.includes('REQUEST_DATASET_CHANGES') ?? false;
  const canPickProposal = permissionsData?.includes('VIEW_DATASET_PROPOSALS') ?? false;
  
  const handleBack = useCallback(() => {
    // Prefer navigating back in browser history to preserve origin (filters, query, etc.)
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    // Fallback if no history is available (direct deep link)
    router.push("/dashboard/datasets");
  }, [router]);
  
  const handleDownloadFile = useCallback(async (uploadId: string) => {
    try {
      const response = await downloadUrlMutation.mutateAsync(datasetId);
      
      // Create a hidden anchor element to trigger the download
      const link = document.createElement('a');
      link.href = response.url;
      link.download = response.upload.originalFileName || 'download';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started');
    } catch {
      // Error is already handled by the mutation's onError
      // No need to show another toast
    }
  }, [datasetId, downloadUrlMutation]);

  const handleActionConfirm = useCallback(
    async (
      action: "approve" | "reject" | "request_changes" | "pick",
      notes: string,
      datasetNeedsChanges?: boolean,
      pricingNeedsChanges?: boolean
    ) => {
      try {
        if (action === "pick") {
          await pickProposalMutation.mutateAsync(datasetId);
          toast.success("Proposal assigned to you");
        } else if (action === "approve") {
          await approveProposalMutation.mutateAsync({
            datasetId,
            data: notes ? { notes } : undefined
          });
          toast.success("Proposal approved successfully");
        } else if (action === "reject") {
          await rejectProposalMutation.mutateAsync({
            datasetId,
            data: {
              rejectionReason: notes || "Rejected",
              notes: notes || undefined
            }
          });
          toast.success("Proposal rejected");
        } else if (action === "request_changes") {
          // Route to appropriate endpoint based on which flags are set
          if (pricingNeedsChanges && !datasetNeedsChanges) {
            // Only pricing changes
            await requestPricingChangesMutation.mutateAsync({
              datasetId,
              data: {
                notes,
                datasetNeedsChanges: false,
                pricingNeedsChanges: true
              }
            });
          } else if (datasetNeedsChanges && !pricingNeedsChanges) {
            // Only dataset changes
            await requestChangesMutation.mutateAsync({
              datasetId,
              data: {
                notes,
                datasetNeedsChanges: true,
                pricingNeedsChanges: false
              }
            });
          } else if (datasetNeedsChanges && pricingNeedsChanges) {
            // Both dataset and pricing changes - call both endpoints
            await Promise.all([
              requestChangesMutation.mutateAsync({
                datasetId,
                data: {
                  notes,
                  datasetNeedsChanges: true,
                  pricingNeedsChanges: false
                }
              }),
              requestPricingChangesMutation.mutateAsync({
                datasetId,
                data: {
                  notes,
                  datasetNeedsChanges: false,
                  pricingNeedsChanges: true
                }
              })
            ]);
          }
          toast.success("Changes requested");
        }
        refetch();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '';
        toast.error(message || `Failed to ${action} proposal`);
      }
    },
    [datasetId, pickProposalMutation, approveProposalMutation, rejectProposalMutation, requestChangesMutation, requestPricingChangesMutation, refetch]
  );
  
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
          <Button variant="outline" onClick={handleBack}>
            Back to proposals
          </Button>
        </div>
      </div>
    );
  }
  
  const { dataset, verification, activeAssignment, primaryCategory, secondaryCategories, source, aboutDatasetInfo, dataFormatInfo, features } = datasetData;
  
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatFileSize = (bytes: string | null) => {
    if (!bytes) return 'Unknown';
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
    return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "var(--bg-surface)" }}>
      {/* Header */}
      <div 
        className="border-b sticky top-0 z-10"
        style={{ 
          backgroundColor: "var(--bg-base)", 
          borderColor: "var(--border-default)" 
        }}
      >
        <div className="p-4 md:p-6 max-w-full">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mt-1 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 
                    className="text-xl md:text-2xl font-bold break-words"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {dataset.title}
                  </h1>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {dataset.datasetUniqueId}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-sm" style={{ color: "var(--text-muted)" }}>
                  <span className="truncate">Owner: {dataset.ownerType}</span>
                  <span className="flex-shrink-0">•</span>
                  <span className="truncate">Updated: {formatDate(dataset.updatedAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              <StatusBadge 
                status={dataset.status.replace(/_/g, ' ')}
                semanticType={getDatasetStatusSemantic(dataset.status)}
              />
              <StatusBadge 
                status={verification.status.replace(/_/g, ' ')}
                semanticType={getVerificationStatusSemantic(verification.status)}
              />
              {datasetData.dataset.pricing && (
                <StatusBadge 
                  status={`Pricing: ${datasetData.dataset.pricing.status.replace(/_/g, ' ')}`}
                  semanticType={datasetData.dataset.pricing.status === 'ACTIVE' || datasetData.dataset.pricing.status === 'VERIFIED' ? 'success' : datasetData.dataset.pricing.status === 'CHANGES_REQUESTED' ? 'warning' : datasetData.dataset.pricing.status === 'REJECTED' ? 'error' : 'neutral'}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 md:px-6 py-4 md:py-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6 min-w-0">
            {/* Dataset Information */}
            <Card className="overflow-hidden" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
              <CardHeader style={{ borderBottomColor: "var(--border-default)" }} className="border-b">
                <CardTitle style={{ color: "var(--text-primary)" }}>Dataset Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Category</p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>{primaryCategory.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Source</p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>{source.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Type</p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>{dataset.superType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Visibility</p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>{dataset.visibility}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>License</p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>{dataset.license || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Pricing</p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>
                      {dataset.pricing?.isPaid ? `${dataset.pricing.price} ${dataset.pricing.currency}` : 'Free'}
                    </p>
                  </div>
                </div>
                
                {secondaryCategories.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2" style={{ color: "var(--text-muted)" }}>Secondary Categories</p>
                      <div className="flex flex-wrap gap-2">
                        {secondaryCategories.map(cat => (
                          <Badge key={cat.id} variant="secondary">{cat.name}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* About Dataset */}
            {aboutDatasetInfo && (
              <Card className="overflow-hidden" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
                <CardHeader style={{ borderBottomColor: "var(--border-default)" }} className="border-b">
                  <CardTitle style={{ color: "var(--text-primary)" }}>About Dataset</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aboutDatasetInfo.overview && (
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Overview</p>
                      <p className="text-sm break-words" style={{ color: "var(--text-primary)" }}>{aboutDatasetInfo.overview}</p>
                    </div>
                  )}
                  {aboutDatasetInfo.description && (
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Description</p>
                      <p className="text-sm break-words" style={{ color: "var(--text-primary)" }}>{aboutDatasetInfo.description}</p>
                    </div>
                  )}
                  {aboutDatasetInfo.dataQuality && (
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Data Quality</p>
                      <p className="text-sm break-words" style={{ color: "var(--text-primary)" }}>{aboutDatasetInfo.dataQuality}</p>
                    </div>
                  )}
                  {aboutDatasetInfo.useCases && (
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Use Cases</p>
                      <p className="text-sm break-words" style={{ color: "var(--text-primary)" }}>{aboutDatasetInfo.useCases}</p>
                    </div>
                  )}
                  {aboutDatasetInfo.limitations && (
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Limitations</p>
                      <p className="text-sm break-words" style={{ color: "var(--text-primary)" }}>{aboutDatasetInfo.limitations}</p>
                    </div>
                  )}
                  {aboutDatasetInfo.methodology && (
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Methodology</p>
                      <p className="text-sm break-words" style={{ color: "var(--text-primary)" }}>{aboutDatasetInfo.methodology}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Data Format */}
            {dataFormatInfo && (
              <Card className="overflow-hidden" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
                <CardHeader style={{ borderBottomColor: "var(--border-default)" }} className="border-b">
                  <CardTitle style={{ color: "var(--text-primary)" }}>Data Format</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {dataFormatInfo.fileFormat && (
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Format</p>
                        <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>{dataFormatInfo.fileFormat}</p>
                      </div>
                    )}
                    {dataFormatInfo.rows && (
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Rows</p>
                        <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>{dataFormatInfo.rows.toLocaleString()}</p>
                      </div>
                    )}
                    {dataFormatInfo.cols && (
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Columns</p>
                        <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>{dataFormatInfo.cols}</p>
                      </div>
                    )}
                    {dataFormatInfo.fileSize && (
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>File Size</p>
                        <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>{formatFileSize(dataFormatInfo.fileSize)}</p>
                      </div>
                    )}
                    {dataFormatInfo.encoding && (
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Encoding</p>
                        <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>{dataFormatInfo.encoding}</p>
                      </div>
                    )}
                    {dataFormatInfo.compressionType && (
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Compression</p>
                        <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>{dataFormatInfo.compressionType}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pricing Information */}
            {datasetData?.dataset?.pricing && (
              <PricingReviewCard pricing={datasetData.dataset.pricing} isDark={false} />
            )}

            {/* Features/Schema */}
            {features.length > 0 && (
              <Card className="overflow-hidden" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
                <CardHeader style={{ borderBottomColor: "var(--border-default)" }} className="border-b">
                  <CardTitle style={{ color: "var(--text-primary)" }}>Features ({features.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b" style={{ borderColor: "var(--border-default)" }}>
                            <th className="text-left p-2 font-medium whitespace-nowrap" style={{ color: "var(--text-muted)" }}>Name</th>
                            <th className="text-left p-2 font-medium whitespace-nowrap" style={{ color: "var(--text-muted)" }}>Data Type</th>
                            <th className="text-left p-2 font-medium whitespace-nowrap" style={{ color: "var(--text-muted)" }}>Nullable</th>
                            <th className="text-left p-2 font-medium whitespace-nowrap" style={{ color: "var(--text-muted)" }}>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {features.map((feature) => (
                            <tr key={feature.id} className="border-b" style={{ borderColor: "var(--border-default)" }}>
                              <td className="p-2 break-words" style={{ color: "var(--text-primary)" }}>{feature.name}</td>
                              <td className="p-2 whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>{feature.dataType}</td>
                              <td className="p-2">
                                {feature.isNullable ? (
                                  <Badge variant="outline" className="text-xs whitespace-nowrap">Yes</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs whitespace-nowrap">No</Badge>
                                )}
                              </td>
                              <td className="p-2 break-words" style={{ color: "var(--text-muted)" }}>{feature.description || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4 md:space-y-6 min-w-0 lg:sticky lg:top-24 lg:h-fit">
            {/* Review Actions - Wrapped in Card for consistency */}
            <div style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)", border: "1px solid var(--border-default)", borderRadius: "var(--radius, 0.5rem)", overflow: "hidden" }}>
              <div style={{ borderBottomColor: "var(--border-default)", borderBottom: "1px solid var(--border-default)", padding: "1rem" }}>
                <h3 style={{ color: "var(--text-primary)", fontWeight: "600" }}>Review Actions</h3>
              </div>
              <div style={{ padding: "1rem" }}>
            <ReviewActions
              currentStatus={dataset.status}
              ownerType={dataset.ownerType.toLowerCase() as "platform" | "supplier"}
              canApprove={canApprove}
              canReject={canReject}
              canRequestChanges={canRequestChanges}
              onActionConfirm={handleActionConfirm}
            />
              </div>
            </div>

            {/* Verification Status */}
            <Card className="overflow-hidden" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
              <CardHeader style={{ borderBottomColor: "var(--border-default)" }} className="border-b">
                <CardTitle style={{ color: "var(--text-primary)" }}>Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Status</p>
                  <div className="mt-1">
                    <StatusBadge 
                      status={verification.status.replace(/_/g, ' ')}
                      semanticType={getVerificationStatusSemantic(verification.status)}
                    />
                  </div>
                </div>
                
                {verification.submittedAt && (
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Submitted</p>
                    <p className="text-sm mt-1 break-words" style={{ color: "var(--text-primary)" }}>{formatDate(verification.submittedAt)}</p>
                  </div>
                )}
                
                {verification.verifiedAt && (
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Verified</p>
                    <p className="text-sm mt-1 break-words" style={{ color: "var(--text-primary)" }}>{formatDate(verification.verifiedAt)}</p>
                  </div>
                )}
                
                {verification.rejectedAt && (
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Rejected</p>
                    <p className="text-sm mt-1 break-words" style={{ color: "var(--text-primary)" }}>{formatDate(verification.rejectedAt)}</p>
                  </div>
                )}
                
                {verification.rejectionReason && (
                  <div className="p-3 rounded-lg break-words" style={{ backgroundColor: "var(--bg-surface)" }}>
                    <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Rejection Reason</p>
                    <p className="text-sm break-words" style={{ color: "var(--text-primary)" }}>{verification.rejectionReason}</p>
                  </div>
                )}
                
                {verification.notes && (
                  <div className="p-3 rounded-lg break-words" style={{ backgroundColor: "var(--bg-surface)" }}>
                    <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Notes</p>
                    <p className="text-sm break-words" style={{ color: "var(--text-primary)" }}>{verification.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Upload */}
            {verification.currentUpload && (
              <Card className="overflow-hidden" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
                <CardHeader style={{ borderBottomColor: "var(--border-default)" }} className="border-b">
                  <CardTitle style={{ color: "var(--text-primary)" }}>Current Upload</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Scope</p>
                    <Badge variant="outline" className="mt-1">{verification.currentUpload.scope}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Status</p>
                    <Badge variant="outline" className="mt-1">{verification.currentUpload.status}</Badge>
                  </div>
                  {verification.currentUpload.sizeBytes && (
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Size</p>
                      <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>{formatFileSize(verification.currentUpload.sizeBytes)}</p>
                    </div>
                  )}
                  {verification.currentUpload.uploadedAt && (
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Uploaded</p>
                      <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>{formatDate(verification.currentUpload.uploadedAt)}</p>
                    </div>
                  )}
                  
                  {/* Download Button */}
                  {verification.currentUpload && (
                    <Button
                      onClick={() => handleDownloadFile(verification.currentUpload!.id)}
                      variant="outline"
                      className="w-full mt-4 gap-2"
                      style={{
                        borderColor: "var(--border-default)",
                        color: "var(--text-primary)"
                      }}
                    >
                      <Download className="w-4 h-4" />
                      <span>Download File</span>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Assignment */}
            {activeAssignment && (
              <Card className="overflow-hidden" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
                <CardHeader style={{ borderBottomColor: "var(--border-default)" }} className="border-b">
                  <CardTitle style={{ color: "var(--text-primary)" }}>Assignment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Assigned To</p>
                    <p className="text-sm mt-1 break-words" style={{ color: "var(--text-primary)" }}>{activeAssignment.adminId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Status</p>
                    <Badge variant="outline" className="mt-1">{activeAssignment.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
