/**
 * ActionDialog - Generic confirmation dialog for user actions
 */

'use client';

import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type ActionType = 'suspend' | 'delete' | 'activate';

interface ActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ActionType;
  targetName: string;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  subjectLabel?: string;
}

const ACTION_CONFIG: Record<
  ActionType,
  {
    title: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    warningBg: string;
    warningBorder: string;
    warningText: string;
    buttonBg: string;
    buttonText: string;
  }
> = {
  suspend: {
    title: 'Suspend User',
    icon: <AlertTriangle className="w-6 h-6" />,
    iconBg: 'var(--status-warning-bg)',
    iconColor: 'var(--state-warning)',
    warningBg: 'var(--status-warning-bg)',
    warningBorder: 'var(--status-warning-border)',
    warningText: 'This user will lose access to all datasets and will not be able to log in.',
    buttonBg: 'var(--action-warning)',
    buttonText: 'Suspend User',
  },
  delete: {
    title: 'Delete User',
    icon: <Trash2 className="w-6 h-6" />,
    iconBg: 'var(--status-error-bg)',
    iconColor: 'var(--state-error)',
    warningBg: 'var(--status-error-bg)',
    warningBorder: 'var(--status-error-border)',
    warningText:
      'This action is permanent. The user will be soft-deleted and all access revoked. Order history will be preserved for compliance.',
    buttonBg: 'var(--action-destructive)',
    buttonText: 'Delete User',
  },
  activate: {
    title: 'Activate User',
    icon: <AlertTriangle className="w-6 h-6" />,
    iconBg: 'var(--status-success-bg)',
    iconColor: 'var(--state-success)',
    warningBg: 'var(--status-success-bg)',
    warningBorder: 'var(--status-success-border)',
    warningText: 'This user will regain access to their granted datasets and be able to log in.',
    buttonBg: 'var(--action-success)',
    buttonText: 'Activate User',
  },
};

const ACTION_GERUNDS: Record<ActionType, string> = {
  suspend: 'suspending',
  delete: 'deleting',
  activate: 'activating',
};

export function ActionDialog({
  open,
  onOpenChange,
  action,
  targetName,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
  subjectLabel = 'user',
}: ActionDialogProps) {
  const config = ACTION_CONFIG[action];
  const capitalizedSubject = subjectLabel.charAt(0).toUpperCase() + subjectLabel.slice(1);
  const title = config.title.replace('User', capitalizedSubject);
  const warningText = config.warningText.replaceAll('user', subjectLabel);
  const buttonText = config.buttonText.replace('User', capitalizedSubject);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: config.iconBg,
              }}
            >
              <div style={{ color: config.iconColor }}>{config.icon}</div>
            </div>
            <div>
              <DialogTitle style={{ color: 'var(--text-primary)' }}>{title}</DialogTitle>
              <DialogDescription className="mt-1" style={{ color: 'var(--text-muted)' }}>
                {targetName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div
            className={`p-4 rounded-lg ${action === 'delete' ? 'border-l-4' : ''}`}
            style={{
              backgroundColor: config.warningBg,
              border: action === 'delete' ? undefined : `1px solid ${config.warningBorder}`,
              borderColor: action === 'delete' ? config.warningBorder : undefined,
            }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {warningText}
            </p>
          </div>

          <div>
            <Label htmlFor="reason" className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Reason <span style={{ color: 'var(--status-error)' }}>*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder={`Provide a clear reason for ${ACTION_GERUNDS[action]} this ${subjectLabel}...`}
              className="min-h-24 mt-2"
              minLength={3}
              maxLength={1000}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              3–1000 characters
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
            onClick={onConfirm}
            disabled={reason.trim().length < 3}
            style={
              reason.trim().length < 3
                ? {
                    backgroundColor: 'var(--text-disabled)',
                    color: 'var(--action-on-status)',
                    opacity: 0.5,
                  }
                : { backgroundColor: config.buttonBg, color: 'var(--action-on-status)' }
            }
          >
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
