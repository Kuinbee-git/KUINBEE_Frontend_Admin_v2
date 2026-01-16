/**
 * AdminPermissionsMatrix - Permission checkboxes organized by domain
 * Uses string-based permissions matching backend
 */
"use client";
import React from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PERMISSIONS, PERMISSION_LABELS, ALL_PERMISSIONS } from '@/lib/constants/permissions';

interface AdminPermissionsMatrixProps {
  permissions: string[];
  isEditing: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onPermissionToggle: (permissionId: string) => void;
}

interface PermissionDomain {
  name: string;
  label: string;
  permissions: string[];
}

export function AdminPermissionsMatrix({
  permissions,
  isEditing,
  onToggleEdit,
  onSave,
  onCancel,
  onPermissionToggle,
}: AdminPermissionsMatrixProps) {
  // Get all domains with their permissions
  const domains: PermissionDomain[] = [
    {
      name: 'categories',
      label: 'Categories',
      permissions: Object.values(PERMISSIONS.CATEGORIES),
    },
    {
      name: 'sources',
      label: 'Sources',
      permissions: Object.values(PERMISSIONS.SOURCES),
    },
    {
      name: 'datasets',
      label: 'Datasets',
      permissions: Object.values(PERMISSIONS.DATASETS),
    },
    {
      name: 'suppliers',
      label: 'Suppliers',
      permissions: Object.values(PERMISSIONS.SUPPLIERS),
    },
    {
      name: 'users',
      label: 'Users',
      permissions: Object.values(PERMISSIONS.USERS),
    },
    {
      name: 'admins',
      label: 'Admins',
      permissions: Object.values(PERMISSIONS.ADMINS),
    },
    {
      name: 'roles',
      label: 'Roles',
      permissions: Object.values(PERMISSIONS.ROLES),
    },
    {
      name: 'audit',
      label: 'Audit',
      permissions: Object.values(PERMISSIONS.AUDIT),
    },
  ];

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
          return (
            <div key={domain.name}>
              <h4 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                {domain.label} ({domain.permissions.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {domain.permissions.map((permissionId) => {
                  const granted = permissions.includes(permissionId);
                  const label = PERMISSION_LABELS[permissionId] || permissionId;
                  
                  return (
                    <label
                      key={permissionId}
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
                        onChange={() => onPermissionToggle(permissionId)}
                        className="w-4 h-4"
                        style={{ accentColor: 'var(--brand-primary)' }}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <Shield className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-primary)' }}>{label}</span>
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
