/**
 * AdminProfileSection - Admin profile and employment information
 */
"use client";
import React from 'react';
import { User, Mail, Phone, Briefcase, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AdminDetailResponse } from '@/types/admin.types';

interface AdminProfileSectionProps {
  admin: AdminDetailResponse;
  isEditing: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  editData: {
    employeeId: string;
    department: string;
  };
  onEditChange: (field: string, value: string) => void;
}

export function AdminProfileSection({
  admin,
  isEditing,
  onToggleEdit,
  onSave,
  onCancel,
  editData,
  onEditChange,
}: AdminProfileSectionProps) {
  const displayName = admin.admin.email.split('@')[0];
  
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
          Profile & Employment
        </h3>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={onToggleEdit}>
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={onSave}>
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 mt-0.5" style={{ color: 'var(--text-muted)' }} />
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Full Name</p>
            <p style={{ color: 'var(--text-primary)' }}>{displayName}</p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 mt-0.5" style={{ color: 'var(--text-muted)' }} />
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Email</p>
            <p style={{ color: 'var(--text-primary)' }}>{admin.admin.email}</p>
          </div>
        </div>

        {/* Phone */}
        {admin.admin.phone && (
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 mt-0.5" style={{ color: 'var(--text-muted)' }} />
            <div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Phone</p>
              <p style={{ color: 'var(--text-primary)' }}>{admin.admin.phone}</p>
            </div>
          </div>
        )}

        {/* Employee ID */}
        <div className="flex items-start gap-3">
          <Hash className="w-5 h-5 mt-0.5" style={{ color: 'var(--text-muted)' }} />
          <div className="flex-1">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Employee ID</p>
            {isEditing ? (
              <input
                type="text"
                value={editData.employeeId}
                onChange={(e) => onEditChange('employeeId', e.target.value)}
                className="w-full px-2 py-1 rounded border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            ) : (
              <p style={{ color: 'var(--text-primary)' }}>
                {admin.admin.id}
              </p>
            )}
          </div>
        </div>

        {/* Department */}
        <div className="flex items-start gap-3">
          <Briefcase className="w-5 h-5 mt-0.5" style={{ color: 'var(--text-muted)' }} />
          <div className="flex-1">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Department</p>
            {isEditing ? (
              <input
                type="text"
                value={editData.department}
                onChange={(e) => onEditChange('department', e.target.value)}
                className="w-full px-2 py-1 rounded border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            ) : (
              <p style={{ color: 'var(--text-primary)' }}>
                {admin.adminProfile?.department || 'N/A'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
