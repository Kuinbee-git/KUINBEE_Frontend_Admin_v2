/**
 * AdminDerivedRoleSection - Derived role summary based on permissions
 */
"use client";
import React from 'react';
import { Shield, Award } from 'lucide-react';
import { deriveTypeFromPermissions, getAdminTypeLabel, countGrantedPermissions } from '@/utils/admin.utils';

interface AdminDerivedRoleSectionProps {
  permissions: string[];
}

export function AdminDerivedRoleSection({ permissions }: AdminDerivedRoleSectionProps) {
  const grantedCount = countGrantedPermissions(permissions);
  const derivedType = deriveTypeFromPermissions(permissions);
  const typeLabel = getAdminTypeLabel(derivedType);

  // Type color based on derived type
  const getTypeColor = () => {
    switch (derivedType) {
      case 'SUPERADMIN':
        return '#ef4444'; // red
      case 'ADMIN':
        return '#3b82f6'; // blue
      default:
        return 'var(--text-muted)';
    }
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
        Derived Role Summary
      </h3>

      <div className="flex items-center gap-4">
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <Award className="w-8 h-8" style={{ color: getTypeColor() }} />
        </div>

        <div className="flex-1">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Based on {grantedCount} granted permissions
          </p>
          <p className="text-2xl font-bold" style={{ color: getTypeColor() }}>
            {typeLabel}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Permission Level</p>
          <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {grantedCount}/31
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 rounded" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          <Shield className="w-4 h-4 inline mr-1" />
          Role is automatically derived from granted permissions:
        </p>
        <ul className="mt-2 space-y-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          <li>• Super Admin: 25+ permissions</li>
          <li>• Admin: &lt;25 permissions</li>
        </ul>
      </div>
    </div>
  );
}
