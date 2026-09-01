import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import type { AuthUser } from '@/types';
import { formatEnumLabel } from '@/components/shared/StatusBadge';

interface ProfileHeaderProps {
  fullName: string;
  email: string;
  currentUser: AuthUser | null | undefined;
  inferredRole: string;
}

function getStatusBadgeStyle(status: string) {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return {
        backgroundColor: 'var(--status-success-bg)',
        color: 'var(--status-success)',
        borderColor: 'var(--status-success-border)',
      };
    case 'SUSPENDED':
      return {
        backgroundColor: 'var(--status-warning-bg)',
        color: 'var(--status-warning)',
        borderColor: 'var(--status-warning-border)',
      };
    case 'INACTIVE':
    case 'DELETED':
      return {
        backgroundColor: 'var(--status-neutral-bg)',
        color: 'var(--status-neutral)',
        borderColor: 'var(--status-neutral-border)',
      };
    default:
      return {
        backgroundColor: 'var(--status-neutral-bg)',
        color: 'var(--status-neutral)',
        borderColor: 'var(--status-neutral-border)',
      };
  }
}

export function ProfileHeader({ fullName, email, currentUser, inferredRole }: ProfileHeaderProps) {
  return (
    <div
      className="mb-4 p-4 sm:p-6"
      style={{
        backgroundColor: 'var(--bg-base)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {fullName}
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            {email}
          </p>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {/* Status Badge */}
            {currentUser?.status && (
              <Badge className="px-2.5 py-1" style={getStatusBadgeStyle(currentUser.status)}>
                {formatEnumLabel(currentUser.status)}
              </Badge>
            )}
            {/* User Type Badge */}
            {currentUser?.userType && (
              <Badge variant="outline" className="px-2.5 py-1">
                {formatEnumLabel(currentUser.userType)}
              </Badge>
            )}
            {/* Email Verified Badge */}
            {currentUser && (
              <div className="flex items-center gap-1.5 text-sm">
                {currentUser.emailVerified ? (
                  <>
                    <CheckCircle
                      aria-hidden="true"
                      className="h-4 w-4"
                      style={{ color: 'var(--state-success)' }}
                    />
                    <span style={{ color: 'var(--state-success)' }}>Email Verified</span>
                  </>
                ) : (
                  <>
                    <XCircle
                      aria-hidden="true"
                      className="h-4 w-4"
                      style={{ color: 'var(--state-error)' }}
                    />
                    <span style={{ color: 'var(--state-error)' }}>Email Not Verified</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Role
          </p>
          <p className="mt-1 font-semibold" style={{ color: 'var(--text-primary)' }}>
            {inferredRole}
          </p>
        </div>
      </div>
    </div>
  );
}
