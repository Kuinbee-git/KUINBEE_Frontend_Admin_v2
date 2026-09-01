'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatEnumLabel, StatusBadge } from '@/components/shared/StatusBadge';
import type { Source } from '@/types';

interface SourceDialogsProps {
  dialogMode: 'create' | 'edit' | 'verify' | 'delete' | null;
  selectedSource: Source | null;
  sourceName: string;
  setSourceName: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (value: string) => void;
  formError: string | null;
  deleteConfirmation: string;
  setDeleteConfirmation: (value: string) => void;
  onSave: () => void;
  onVerify: () => void;
  onDelete: () => void;
  onCancel: () => void;
  isBusy: boolean;
}

export function SourceDialogs({
  dialogMode,
  selectedSource,
  sourceName,
  setSourceName,
  description,
  setDescription,
  websiteUrl,
  setWebsiteUrl,
  formError,
  deleteConfirmation,
  setDeleteConfirmation,
  onSave,
  onVerify,
  onDelete,
  onCancel,
  isBusy,
}: SourceDialogsProps) {
  const canDelete = selectedSource && deleteConfirmation === selectedSource.name;

  return (
    <>
      {/* Create/Edit Dialog */}
      <Dialog open={dialogMode === 'create' || dialogMode === 'edit'} onOpenChange={onCancel}>
        <DialogContent
          className="max-w-2xl"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--text-primary)' }}>
              {dialogMode === 'create' ? 'Create Source' : 'Edit Source'}
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--text-muted)' }}>
              {dialogMode === 'create'
                ? 'Create a new dataset origin source.'
                : 'Update source information.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label
                htmlFor="source-name"
                className="text-xs mb-2 block"
                style={{ color: 'var(--text-muted)' }}
              >
                Source Name <span style={{ color: 'var(--status-error)' }}>*</span>
              </Label>
              <Input
                id="source-name"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="Enter source name..."
                maxLength={200}
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {formError ? (
              <p className="text-sm" role="alert" style={{ color: 'var(--status-error)' }}>
                {formError}
              </p>
            ) : null}

            <div>
              <Label
                htmlFor="description"
                className="text-xs mb-2 block"
                style={{ color: 'var(--text-muted)' }}
              >
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter source description..."
                className="min-h-24"
                maxLength={5000}
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <Label
                htmlFor="website-url"
                className="text-xs mb-2 block"
                style={{ color: 'var(--text-muted)' }}
              >
                Website URL (Optional)
              </Label>
              <Input
                id="website-url"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
                maxLength={2048}
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {dialogMode === 'edit' && selectedSource && (
              <>
                <Separator style={{ backgroundColor: 'var(--border-default)' }} />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      Created By
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {selectedSource.createdByUser?.name || 'Creator unavailable'}
                    </p>
                    {selectedSource.createdByUser?.email ? (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {selectedSource.createdByUser.email}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <p className="mb-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      Created By Type
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {formatEnumLabel(selectedSource.createdByType)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      Verification Status
                    </p>
                    <StatusBadge
                      status={selectedSource.isVerified ? 'Verified' : 'Unverified'}
                      semanticType={selectedSource.isVerified ? 'success' : 'neutral'}
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      Created At
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(selectedSource.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={onCancel}
              style={{
                backgroundColor: 'var(--bg-hover)',
                color: 'var(--text-primary)',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={!sourceName.trim() || isBusy}
              style={
                !sourceName.trim() || isBusy
                  ? {
                      backgroundColor: 'var(--text-disabled)',
                      color: 'var(--brand-on-primary)',
                      opacity: 0.5,
                      cursor: 'not-allowed',
                    }
                  : {
                      backgroundColor: 'var(--brand-primary)',
                      color: 'var(--brand-on-primary)',
                    }
              }
            >
              {isBusy ? 'Saving…' : dialogMode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Confirmation Dialog */}
      <Dialog open={dialogMode === 'verify'} onOpenChange={onCancel}>
        <DialogContent
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--status-success-bg)' }}
              >
                <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--status-success)' }} />
              </div>
              <div>
                <DialogTitle style={{ color: 'var(--text-primary)' }}>Verify Source</DialogTitle>
                <DialogDescription style={{ color: 'var(--text-muted)' }}>
                  Mark this source as verified
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              You are about to verify the source <strong>&quot;{selectedSource?.name}&quot;</strong>
              .
            </p>

            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--status-info-bg)',
                border: '1px solid var(--status-info-border)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <strong>Note:</strong> Verification affects future dataset selection only. Existing
                datasets remain unchanged. This action will be logged in the audit trail.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={onCancel}
              style={{
                backgroundColor: 'var(--bg-hover)',
                color: 'var(--text-primary)',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={onVerify}
              disabled={isBusy}
              style={{
                backgroundColor: 'var(--status-success)',
                color: 'var(--brand-on-primary)',
              }}
            >
              {isBusy ? 'Verifying…' : 'Verify Source'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={dialogMode === 'delete'} onOpenChange={onCancel}>
        <DialogContent
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--status-error-bg)' }}
              >
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--status-error)' }} />
              </div>
              <div>
                <DialogTitle style={{ color: 'var(--text-primary)' }}>Delete Source</DialogTitle>
                <DialogDescription style={{ color: 'var(--text-muted)' }}>
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedSource && (selectedSource.datasetCount || 0) > 0 ? (
              <div
                className="p-4 rounded-lg border-l-4"
                style={{
                  backgroundColor: 'var(--status-error-bg)',
                  borderColor: 'var(--status-error)',
                }}
              >
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--status-error)' }}>
                  <strong>Warning:</strong> This source is used by{' '}
                  {selectedSource.datasetCount || 0} dataset
                  {(selectedSource.datasetCount || 0) !== 1 ? 's' : ''}.
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Deleting this source will not remove it from existing datasets. Strongly consider
                  disabling instead of deletion to preserve lineage.
                </p>
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You are about to delete the source{' '}
                <strong>&quot;{selectedSource?.name}&quot;</strong>.
              </p>
            )}

            <div>
              <Label
                htmlFor="delete-confirmation"
                className="text-xs mb-2 block"
                style={{ color: 'var(--text-muted)' }}
              >
                Type the source name to confirm: <strong>{selectedSource?.name}</strong>
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type source name..."
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={onCancel}
              style={{
                backgroundColor: 'var(--bg-hover)',
                color: 'var(--text-primary)',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={onDelete}
              disabled={!canDelete || isBusy}
              style={
                !canDelete || isBusy
                  ? {
                      backgroundColor: 'var(--text-disabled)',
                      color: 'var(--brand-on-primary)',
                      opacity: 0.5,
                      cursor: 'not-allowed',
                    }
                  : { backgroundColor: 'var(--status-error)', color: 'var(--brand-on-primary)' }
              }
            >
              {isBusy ? 'Deleting…' : 'Delete Source'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
