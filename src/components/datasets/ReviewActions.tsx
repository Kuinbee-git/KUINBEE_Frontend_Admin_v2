'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

type ActionType = 'approve' | 'reject' | 'request_changes' | null;

interface ReviewActionsProps {
  currentStatus: string;
  ownerType: 'platform' | 'supplier';
  canApprove: boolean;
  canReject: boolean;
  canRequestChanges: boolean;
  isPicked: boolean;
  onActionConfirm: (
    action: 'approve' | 'reject' | 'request_changes',
    datasetNotes: string,
    pricingNotes?: string,
    datasetNeedsChanges?: boolean,
    pricingNeedsChanges?: boolean
  ) => Promise<void>;
}

export function ReviewActions({
  canApprove,
  canReject,
  canRequestChanges,
  isPicked,
  onActionConfirm,
}: ReviewActionsProps) {
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [datasetNotes, setDatasetNotes] = useState('');
  const [pricingNotes, setPricingNotes] = useState('');
  const [datasetNeedsChanges, setDatasetNeedsChanges] = useState(false);
  const [pricingNeedsChanges, setPricingNeedsChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleActionClick = (action: ActionType) => {
    setActiveAction(action);
    setDatasetNotes('');
    setPricingNotes('');
    setDatasetNeedsChanges(false);
    setPricingNeedsChanges(false);
  };

  const handleConfirm = async () => {
    if (!activeAction) return;

    // Validation logic for each action type
    if (!datasetNeedsChanges && !pricingNeedsChanges) return;

    if (
      activeAction === 'request_changes' ||
      activeAction === 'approve' ||
      activeAction === 'reject'
    ) {
      if (datasetNeedsChanges && datasetNotes.trim().length < 3) return;
      if (pricingNeedsChanges && pricingNotes.trim().length < 3) return;
    }

    setIsSubmitting(true);
    try {
      await onActionConfirm(
        activeAction,
        datasetNotes.trim(),
        pricingNotes.trim(),
        datasetNeedsChanges,
        pricingNeedsChanges
      );
      setActiveAction(null);
      setDatasetNotes('');
      setPricingNotes('');
      setDatasetNeedsChanges(false);
      setPricingNeedsChanges(false);
    } catch {
      // Mutation hooks surface the backend error; preserve the form for correction or retry.
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setActiveAction(null);
    setDatasetNotes('');
    setPricingNotes('');
    setDatasetNeedsChanges(false);
    setPricingNeedsChanges(false);
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'approve':
        return 'Approve Dataset & Pricing';
      case 'reject':
        return 'Reject Dataset & Pricing';
      case 'request_changes':
        return 'Request Changes';
      default:
        return '';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve':
        return <CheckCircle className="w-4 h-4" />;
      case 'reject':
        return <XCircle className="w-4 h-4" />;
      case 'request_changes':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getActionStyle = (action: string) => {
    switch (action) {
      case 'approve':
        return {
          backgroundColor: 'var(--state-success)',
          color: 'var(--brand-on-primary)',
        };
      case 'reject':
        return {
          backgroundColor: 'var(--state-error)',
          color: 'var(--brand-on-primary)',
        };
      case 'request_changes':
        return {
          backgroundColor: 'var(--state-warning)',
          color: 'var(--brand-on-primary)',
        };
      default:
        return {};
    }
  };

  const availableActions = [
    { action: 'approve' as const, canPerform: canApprove },
    { action: 'reject' as const, canPerform: canReject },
    { action: 'request_changes' as const, canPerform: canRequestChanges },
  ].filter((item) => item.canPerform);

  // Only show actions if the proposal has been picked by an admin
  if (!isPicked) {
    return (
      <div className="text-center p-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          This proposal needs to be assigned to an admin before review actions can be taken.
        </p>
      </div>
    );
  }

  if (availableActions.length === 0) {
    return null;
  }

  const isConfirmDisabled = (() => {
    if (!activeAction || isSubmitting) return true;
    if (!datasetNeedsChanges && !pricingNeedsChanges) return true;

    if (activeAction === 'request_changes') {
      if (datasetNeedsChanges && datasetNotes.trim().length < 3) return true;
      if (pricingNeedsChanges && pricingNotes.trim().length < 3) return true;
      return false;
    }

    if (activeAction === 'approve' || activeAction === 'reject') {
      if (datasetNeedsChanges && datasetNotes.trim().length < 3) return true;
      if (pricingNeedsChanges && pricingNotes.trim().length < 3) return true;
      return false;
    }

    return true;
  })();

  return (
    <div
      className="p-4 md:p-6 rounded-lg"
      style={{
        backgroundColor: 'var(--bg-base)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Review Actions
      </h2>

      {!activeAction ? (
        <div className="flex flex-col gap-3">
          {availableActions.map(
            ({ action }) =>
              action && (
                <Button
                  key={action}
                  onClick={() => handleActionClick(action)}
                  style={getActionStyle(action)}
                  className="w-full justify-center gap-2"
                >
                  {getActionIcon(action)}
                  <span>{getActionLabel(action)}</span>
                </Button>
              )
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className="p-4 rounded-lg border-l-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderLeftColor:
                activeAction === 'approve'
                  ? 'var(--state-success)'
                  : activeAction === 'reject'
                    ? 'var(--state-error)'
                    : 'var(--state-warning)',
            }}
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {getActionLabel(activeAction)}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {activeAction === 'approve' &&
                'Select which items to approve. Each selected item requires approval notes.'}
              {activeAction === 'reject' &&
                'Select which items to reject. Each selected item requires a rejection reason.'}
              {activeAction === 'request_changes' &&
                'Select what needs changes and provide feedback. The supplier can edit and resubmit.'}
            </p>
          </div>

          {/* Checkboxes for approve, reject, and request_changes */}
          {(activeAction === 'approve' ||
            activeAction === 'reject' ||
            activeAction === 'request_changes') && (
            <div
              className="p-4 rounded-lg space-y-3"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {activeAction === 'request_changes'
                  ? 'What needs to change?'
                  : activeAction === 'approve'
                    ? 'What would you like to approve?'
                    : 'What would you like to reject?'}
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="dataset-action"
                    checked={datasetNeedsChanges}
                    onCheckedChange={(checked) => setDatasetNeedsChanges(checked as boolean)}
                    style={{
                      accentColor:
                        activeAction === 'request_changes'
                          ? 'var(--state-warning)'
                          : activeAction === 'approve'
                            ? 'var(--state-success)'
                            : 'var(--state-error)',
                    }}
                  />
                  <Label
                    htmlFor="dataset-action"
                    className="cursor-pointer text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {activeAction === 'request_changes'
                      ? 'Dataset needs revision'
                      : activeAction === 'approve'
                        ? 'Approve Dataset'
                        : 'Reject Dataset'}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pricing-action"
                    checked={pricingNeedsChanges}
                    onCheckedChange={(checked) => setPricingNeedsChanges(checked as boolean)}
                    style={{
                      accentColor:
                        activeAction === 'request_changes'
                          ? 'var(--state-warning)'
                          : activeAction === 'approve'
                            ? 'var(--state-success)'
                            : 'var(--state-error)',
                    }}
                  />
                  <Label
                    htmlFor="pricing-action"
                    className="cursor-pointer text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {activeAction === 'request_changes'
                      ? 'Pricing needs revision'
                      : activeAction === 'approve'
                        ? 'Approve Pricing'
                        : 'Reject Pricing'}
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Dataset Notes */}
          {datasetNeedsChanges && (
            <div>
              <Label
                htmlFor="dataset-review-notes"
                className="mb-2 block"
                style={{ color: 'var(--text-primary)' }}
              >
                {activeAction === 'approve'
                  ? 'Dataset Approval Notes'
                  : activeAction === 'reject'
                    ? 'Dataset Rejection Reason'
                    : 'Dataset Feedback'}
                <span style={{ color: 'var(--state-error)' }}> *</span>
              </Label>
              <Textarea
                id="dataset-review-notes"
                value={datasetNotes}
                onChange={(e) => setDatasetNotes(e.target.value)}
                placeholder={
                  activeAction === 'approve'
                    ? 'Add notes about the dataset approval...'
                    : activeAction === 'reject'
                      ? 'Explain why the dataset is being rejected...'
                      : 'Describe what needs to be fixed in the dataset...'
                }
                rows={3}
                minLength={3}
                maxLength={3000}
                className="w-full"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-default)',
                }}
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                Minimum 3 characters · {datasetNotes.length}/3000
              </p>
            </div>
          )}

          {/* Pricing Notes */}
          {pricingNeedsChanges && (
            <div>
              <Label
                htmlFor="pricing-review-notes"
                className="mb-2 block"
                style={{ color: 'var(--text-primary)' }}
              >
                {activeAction === 'approve'
                  ? 'Pricing Approval Notes'
                  : activeAction === 'reject'
                    ? 'Pricing Rejection Reason'
                    : 'Pricing Feedback'}
                <span style={{ color: 'var(--state-error)' }}> *</span>
              </Label>
              <Textarea
                id="pricing-review-notes"
                value={pricingNotes}
                onChange={(e) => setPricingNotes(e.target.value)}
                placeholder={
                  activeAction === 'approve'
                    ? 'Add notes about the pricing approval...'
                    : activeAction === 'reject'
                      ? 'Explain why the pricing is being rejected...'
                      : 'Describe what needs to be fixed in the pricing...'
                }
                rows={3}
                minLength={3}
                maxLength={3000}
                className="w-full"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-default)',
                }}
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                Minimum 3 characters · {pricingNotes.length}/3000
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              style={getActionStyle(activeAction)}
              className="flex-1 sm:flex-none"
            >
              {isSubmitting
                ? 'Submitting...'
                : `Confirm ${activeAction === 'approve' ? 'Approval' : activeAction === 'reject' ? 'Rejection' : 'Request'}`}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isSubmitting}
              style={{
                backgroundColor: 'var(--bg-hover)',
                color: 'var(--text-primary)',
              }}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
