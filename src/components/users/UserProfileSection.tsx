/**
 * UserProfileSection - Profile information card
 */

"use client";

import React from 'react';
import { UserProfile } from '@/types/user.types';
import { Badge } from '@/components/ui/badge';

interface UserProfileSectionProps {
  profile: UserProfile;
  phone: string | null;
  emailVerified: boolean;
}

export function UserProfileSection({ profile, phone, emailVerified }: UserProfileSectionProps) {
  return (
    <div
      className="rounded-lg border p-6"
      style={{
        backgroundColor: 'var(--bg-base)',
        borderColor: 'var(--border-default)',
      }}
    >
      <h2 className="mb-4" style={{ color: 'var(--text-primary)' }}>
        Profile Information
      </h2>

      <div className="space-y-4">
        {profile.bio && (
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Bio
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {profile.bio}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Occupation
            </p>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {profile.occupation || '—'}
            </p>
          </div>

          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Organization
            </p>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {profile.organization || '—'}
            </p>
          </div>

          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Institution
            </p>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {profile.institution || '—'}
            </p>
          </div>

          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Phone
            </p>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {phone || '—'}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            Interested Domains
          </p>
          {profile.interestedDomains.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.interestedDomains.map((domain) => (
                <Badge
                  key={domain}
                  variant="outline"
                  className="text-xs"
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    color: '#38bdf8',
                    borderColor: 'rgba(56, 189, 248, 0.3)',
                  }}
                >
                  {domain}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No domains specified
            </p>
          )}
        </div>

        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            Email Verification Status
          </p>
          <div className="flex items-center gap-2 mt-1">
            {emailVerified ? (
              <>
                <span className="text-lg" style={{ color: 'var(--state-success)' }}>
                  ✓
                </span>
                <span className="text-sm" style={{ color: 'var(--state-success)' }}>
                  Email Verified
                </span>
              </>
            ) : (
              <>
                <span className="text-lg" style={{ color: 'var(--state-warning)' }}>
                  ⚠
                </span>
                <span className="text-sm" style={{ color: 'var(--state-warning)' }}>
                  Email Not Verified
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
