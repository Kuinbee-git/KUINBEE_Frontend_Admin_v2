"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { DatasetPricingDto } from "@/types";

interface PricingReviewCardProps {
  pricing: DatasetPricingDto | null;
  isDark?: boolean;
}

export function PricingReviewCard({ pricing, isDark }: PricingReviewCardProps) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'CHANGES_REQUESTED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'ACTIVE':
      case 'VERIFIED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!pricing) {
    return (
      <Card className="overflow-hidden" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
        <CardHeader style={{ borderBottomColor: "var(--border-default)" }} className="border-b">
          <CardTitle style={{ color: "var(--text-primary)" }}>Pricing Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p style={{ color: "var(--text-muted)" }}>No pricing submission found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
      <CardHeader style={{ borderBottomColor: "var(--border-default)" }} className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle style={{ color: "var(--text-primary)" }}>Pricing Information</CardTitle>
          <Badge className={getStatusColor(pricing.status)}>
            {pricing.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* Pricing Details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Type</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>
              {pricing.isPaid ? 'Paid' : 'Free'}
            </p>
          </div>
          
          {pricing.isPaid && pricing.price && (
            <>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Price</p>
                <p className="text-sm mt-1 font-semibold" style={{ color: "var(--text-primary)" }}>
                  {pricing.price}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Currency</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>
                  {pricing.currency}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          {pricing.submittedAt && (
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Submitted</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>{formatDate(pricing.submittedAt)}</p>
            </div>
          )}
          
          {pricing.approvedAt && (
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Approved</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>{formatDate(pricing.approvedAt)}</p>
            </div>
          )}
        </div>

        {/* Change Rationale (if requested changes) */}
        {pricing.status === 'CHANGES_REQUESTED' && pricing.changeRationale && (
          <Alert style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--state-warning)" }} className="border-l-4">
            <AlertDescription style={{ color: "var(--text-primary)" }}>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Changes Requested</p>
              <p className="text-sm">{pricing.changeRationale}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Rejection Reason (if rejected) */}
        {pricing.status === 'REJECTED' && pricing.rejectionReason && (
          <Alert style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--state-error)" }} className="border-l-4">
            <AlertDescription style={{ color: "var(--text-primary)" }}>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Rejection Reason</p>
              <p className="text-sm">{pricing.rejectionReason}</p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
