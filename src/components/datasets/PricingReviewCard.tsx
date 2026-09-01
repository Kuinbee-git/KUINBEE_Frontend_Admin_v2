'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { DatasetPricingDto } from '@/types';
import { formatStatusLabel } from '@/components/shared/StatusBadge';

interface PricingReviewCardProps {
  pricing: DatasetPricingDto | null;
}

export function PricingReviewCard({ pricing }: PricingReviewCardProps) {
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-[var(--status-info-bg)] text-[var(--status-info)] border-[var(--status-info-border)]';
      case 'CHANGES_REQUESTED':
        return 'bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning-border)]';
      case 'ACTIVE':
      case 'VERIFIED':
        return 'bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success-border)]';
      case 'REJECTED':
        return 'bg-[var(--status-error-bg)] text-[var(--status-error)] border-[var(--status-error-border)]';
      default:
        return 'bg-[var(--status-neutral-bg)] text-[var(--status-neutral)] border-[var(--status-neutral-border)]';
    }
  };

  if (!pricing) {
    return (
      <Card
        className="overflow-hidden"
        style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
      >
        <CardHeader style={{ borderBottomColor: 'var(--border-default)' }} className="border-b">
          <CardTitle style={{ color: 'var(--text-primary)' }}>Pricing Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p style={{ color: 'var(--text-muted)' }}>No pricing submission found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="overflow-hidden"
      style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
    >
      <CardHeader style={{ borderBottomColor: 'var(--border-default)' }} className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle style={{ color: 'var(--text-primary)' }}>Pricing Information</CardTitle>
          <Badge className={getStatusColor(pricing.status)}>
            {formatStatusLabel(pricing.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* Pricing Details */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Type
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
              {pricing.isPaid ? 'Paid' : 'Free'}
            </p>
          </div>

          {pricing.isPaid && pricing.price && (
            <>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  Price
                </p>
                <p className="text-sm mt-1 font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {pricing.price}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  Currency
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
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
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Submitted
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                {formatDate(pricing.submittedAt)}
              </p>
            </div>
          )}

          {pricing.approvedAt && (
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Approved
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                {formatDate(pricing.approvedAt)}
              </p>
            </div>
          )}
        </div>

        {/* Change Rationale (if requested changes) */}
        {pricing.status === 'CHANGES_REQUESTED' && pricing.changeRationale && (
          <Alert
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--state-warning)' }}
            className="border-l-4"
          >
            <AlertDescription style={{ color: 'var(--text-primary)' }}>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                Changes Requested
              </p>
              <p className="text-sm">{pricing.changeRationale}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Rejection Reason (if rejected) */}
        {pricing.status === 'REJECTED' && pricing.rejectionReason && (
          <Alert
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--state-error)' }}
            className="border-l-4"
          >
            <AlertDescription style={{ color: 'var(--text-primary)' }}>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                Rejection Reason
              </p>
              <p className="text-sm">{pricing.rejectionReason}</p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
