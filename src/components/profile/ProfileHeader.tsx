import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import type { AuthUser } from '@/types';

interface ProfileHeaderProps {
  fullName: string;
  email: string;
  currentUser: AuthUser | null | undefined;
  inferredRole: string;
}

function getStatusBadgeStyle(status: string) {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return { backgroundColor: 'var(--state-success)', color: '#ffffff' };
    case 'SUSPENDED':
      return { backgroundColor: 'var(--state-warning)', color: '#ffffff' };
    case 'INACTIVE':
    case 'DELETED':
      return { backgroundColor: 'var(--text-muted)', color: '#ffffff' };
    default:
      return { backgroundColor: 'var(--text-muted)', color: '#ffffff' };
  }
}

export function ProfileHeader({ fullName, email, currentUser, inferredRole }: ProfileHeaderProps) {
  return (
    <div
      className="p-6 mb-4"
      style={{
        backgroundColor: 'var(--bg-base)',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="flex items-start justify-between">
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
                {currentUser.status.charAt(0) + currentUser.status.slice(1).toLowerCase().replace(/_/g, ' ')}
              </Badge>
            )}
            {/* User Type Badge */}
            {currentUser?.userType && (
              <Badge variant="outline" className="px-2.5 py-1">
                {currentUser.userType.charAt(0) + currentUser.userType.slice(1).toLowerCase()}
              </Badge>
            )}
            {/* Email Verified Badge */}
            {currentUser && (
              <div className="flex items-center gap-1.5 text-sm">
                {currentUser.emailVerified ? (
                  <>
                    <CheckCircle className="h-4 w-4" style={{ color: 'var(--state-success)' }} />
                    <span style={{ color: 'var(--state-success)' }}>Email Verified</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" style={{ color: 'var(--state-error)' }} />
                    <span style={{ color: 'var(--state-error)' }}>Email Not Verified</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
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
