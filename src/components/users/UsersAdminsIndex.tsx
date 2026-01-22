/**
 * UsersAdminsIndex - Landing page with user/admin tiles
 */

"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Shield, ArrowRight } from 'lucide-react';
import { getCurrentUserPermissions } from '@/utils/permissions.utils';

interface UsersAdminsIndexProps {
  onNavigateToUsers?: () => void;
  onNavigateToAdmins?: () => void;
}

export function UsersAdminsIndex({
  onNavigateToUsers,
  onNavigateToAdmins,
}: UsersAdminsIndexProps) {
  const permissions = getCurrentUserPermissions();

  if (!permissions.canViewUsers && !permissions.canViewAdmins) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div className="text-center">
          <p style={{ color: 'var(--text-secondary)' }}>
            You do not have permission to access this section
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div
        className="p-6 border-b"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <h1 style={{ color: 'var(--text-primary)' }}>Users & Admins</h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
          Manage marketplace users and internal operators
        </p>
      </div>

      <div className="p-6">
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: permissions.canViewUsers && permissions.canViewAdmins
              ? 'repeat(auto-fit, minmax(400px, 1fr))'
              : '1fr',
            maxWidth: permissions.canViewUsers && permissions.canViewAdmins ? 'none' : '600px',
          }}
        >
          {permissions.canViewUsers && (
            <div
              className="rounded-lg border cursor-pointer transition-all group"
              style={{
                backgroundColor: 'var(--bg-base)',
                borderColor: 'var(--border-default)',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              }}
              onClick={onNavigateToUsers}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-base)';
                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
              }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)' }}
                    >
                      <Users className="w-6 h-6" style={{ color: '#38bdf8' }} />
                    </div>
                    <h2 className="text-lg" style={{ color: 'var(--text-primary)' }}>
                      Users
                    </h2>
                  </div>
                  <ArrowRight
                    className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </div>

                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Marketplace users who purchase and access datasets
                </p>

                <div className="flex items-center gap-6 mb-6">
                  <Button
                    onClick={onNavigateToUsers}
                    className="w-full"
                    style={{
                      backgroundColor: 'var(--brand-primary)',
                      color: '#ffffff',
                    }}
                  >
                    View Users
                  </Button>
                </div>
              </div>
            </div>
          )}

          {permissions.canViewAdmins && (
            <div
              className="rounded-lg border cursor-pointer transition-all group"
              style={{
                backgroundColor: 'var(--bg-base)',
                borderColor: 'var(--border-default)',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              }}
              onClick={onNavigateToAdmins}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-base)';
                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
              }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                    >
                      <Shield className="w-6 h-6" style={{ color: '#a78bfa' }} />
                    </div>
                    <h2 className="text-lg" style={{ color: 'var(--text-primary)' }}>
                      Admins
                    </h2>
                  </div>
                  <ArrowRight
                    className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </div>

                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Internal operators with governance permissions
                </p>

                <div className="flex items-center gap-6 mb-6">
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                      Manage internal operators and assign datasets for review
                    </p>
                  </div>
                </div>

                <Button
                  onClick={onNavigateToAdmins}
                  className="w-full"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: '#ffffff',
                  }}
                >
                  View Admins
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
