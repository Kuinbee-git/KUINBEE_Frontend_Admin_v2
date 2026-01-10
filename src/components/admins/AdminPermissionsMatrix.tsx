/**
 * AdminPermissionsMatrix - Permission checkboxes organized by domain
 * Uses string-based permissions matching backend
 */
"use client";
import React from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_PERMISSIONS } from '@/types/admin.types';
import { PERMISSION_DOMAIN_LABELS } from '@/constants/admin.constants';

type PermissionDomain = 'datasets' | 'suppliers' | 'users' | 'categories' | 'sources' | 'admins';

interface AdminPermissionsMatrixProps {
  permissions: string[];
  isEditing: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onPermissionToggle: (permissionId: string) => void;
}

export function AdminPermissionsMatrix({
  permissions,
  isEditing,
  onToggleEdit,
  onSave,
  onCancel,
  onPermissionToggle,
}: AdminPermissionsMatrixProps) {
  const domains: PermissionDomain[] = ['datasets', 'suppliers', 'users', 'categories', 'sources', 'admins'];

  // Get permissions for a domain from ADMIN_PERMISSIONS
  const getDomainPermissions = (domain: PermissionDomain) => {
    return ADMIN_PERMISSIONS.filter(p => p.domain === domain);
  };

  return (
    <div
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: 'var(--bg-base)',
        borderColor: 'var(--border-default)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Permissions Matrix
        </h3>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={onToggleEdit}>
            Edit Permissions
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={onSave}>
              Save Permissions
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {domains.map((domain) => {
          const domainPermissions = getDomainPermissions(domain);
          
          return (
            <div key={domain}>
              <h4 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                {PERMISSION_DOMAIN_LABELS[domain]} ({domainPermissions.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {domainPermissions.map((permission) => {
                  const granted = permissions.includes(permission.id);
                  
                  return (
                    <label
                      key={permission.id}
                      className={`flex items-center gap-2 p-3 rounded border cursor-pointer transition-colors ${
                        isEditing ? 'hover:bg-opacity-80' : ''
                      }`}
                      style={{
                        backgroundColor: granted ? 'var(--bg-selected)' : 'var(--bg-surface)',
                        borderColor: granted ? 'var(--brand-primary)' : 'var(--border-default)',
                        opacity: isEditing ? 1 : 0.7,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={granted}
                        disabled={!isEditing}
                        onChange={() => onPermissionToggle(permission.id)}
                        className="w-4 h-4"
                        style={{ accentColor: 'var(--brand-primary)' }}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <Shield className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-primary)' }}>{permission.label}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
