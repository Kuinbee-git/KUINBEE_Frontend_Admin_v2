/**
 * AdminSecuritySection - Security state and verification status
 * Uses AdminDetailResponse from API
 */
"use client";
import React from 'react';
import { Shield, Mail, Activity } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { getAdminStatusInfo, getAdminTypeLabel } from '@/utils/admin.utils';
import { AdminDetailResponse } from '@/types/admin.types';

interface AdminSecuritySectionProps {
  admin: AdminDetailResponse;
}

export function AdminSecuritySection({ admin }: AdminSecuritySectionProps) {
  const statusInfo = getAdminStatusInfo(admin.admin.status);

  // Map status variant to semantic type
  const getSemanticType = (variant: 'success' | 'error' | 'secondary' | 'warning') => {
    switch (variant) {
      case 'success':
        return 'success' as const;
      case 'error':
        return 'error' as const;
      case 'warning':
        return 'warning' as const;
      case 'secondary':
        return 'neutral' as const;
      default:
        return 'neutral' as const;
    }
  };

  // Format last login time
  const formatLastLogin = (date: string | null) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  return (
    <div
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: 'var(--bg-base)',
        borderColor: 'var(--border-default)',
      }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Security State
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Status */}
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 mt-0.5" style={{ color: 'var(--text-muted)' }} />
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Account Status</p>
            <StatusBadge status={statusInfo.label} semanticType={getSemanticType(statusInfo.variant)} />
          </div>
        </div>

        {/* Type */}
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 mt-0.5" style={{ color: 'var(--text-muted)' }} />
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Admin Type</p>
            <p style={{ color: 'var(--text-primary)' }}>{getAdminTypeLabel(admin.admin.userType)}</p>
          </div>
        </div>

        {/* Email Verified */}
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 mt-0.5" style={{ color: 'var(--text-muted)' }} />
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Email Verified</p>
            <StatusBadge
              status={admin.admin.emailVerified ? 'Verified' : 'Not Verified'}
              semanticType={admin.admin.emailVerified ? 'success' : 'warning'}
            />
          </div>
        </div>

        {/* Last Login */}
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 mt-0.5" style={{ color: 'var(--text-muted)' }} />
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Last Active</p>
            <p style={{ color: 'var(--text-primary)' }}>{formatLastLogin(admin.admin.lastLoginAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
