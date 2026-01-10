/**
 * ActionDialog - Generic confirmation dialog for user actions
 */

"use client";

import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
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
    iconBg: 'rgba(245, 158, 11, 0.1)',
    iconColor: 'var(--state-warning)',
    warningBg: 'rgba(245, 158, 11, 0.05)',
    warningBorder: 'rgba(245, 158, 11, 0.3)',
    warningText: 'This user will lose access to all datasets and will not be able to log in.',
    buttonBg: 'var(--state-warning)',
    buttonText: 'Suspend User',
  },
  delete: {
    title: 'Delete User',
    icon: <Trash2 className="w-6 h-6" />,
    iconBg: 'rgba(239, 68, 68, 0.1)',
    iconColor: 'var(--state-error)',
    warningBg: 'rgba(239, 68, 68, 0.05)',
    warningBorder: 'var(--state-error)',
    warningText:
      'This action is permanent. The user will be soft-deleted and all access revoked. Order history will be preserved for compliance.',
    buttonBg: 'var(--state-error)',
    buttonText: 'Delete User',
  },
  activate: {
    title: 'Activate User',
    icon: <AlertTriangle className="w-6 h-6" />,
    iconBg: 'rgba(16, 185, 129, 0.1)',
    iconColor: 'var(--state-success)',
    warningBg: 'rgba(16, 185, 129, 0.05)',
    warningBorder: 'rgba(16, 185, 129, 0.3)',
    warningText: 'This user will regain access to their granted datasets and be able to log in.',
    buttonBg: 'var(--state-success)',
    buttonText: 'Activate User',
  },
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
}: ActionDialogProps) {
  const config = ACTION_CONFIG[action];

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
              <h2 style={{ color: 'var(--text-primary)' }}>{config.title}</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {targetName}
              </p>
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
              {config.warningText}
            </p>
          </div>

          <div>
            <Label htmlFor="reason" className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Reason {action === 'delete' && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder={`Provide a clear reason for ${action}ing this user...`}
              className="min-h-24 mt-2"
              style={{
                backgroundColor: 'var(--bg-surface)',
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
            onClick={onConfirm}
            disabled={!reason.trim()}
            style={
              !reason.trim()
                ? { backgroundColor: 'var(--text-disabled)', color: '#ffffff', opacity: 0.5 }
                : { backgroundColor: config.buttonBg, color: '#ffffff' }
            }
          >
            {config.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
