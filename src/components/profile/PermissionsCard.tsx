import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const PERMISSION_GROUPS: Record<string, string[]> = {
  'Dataset Governance': [
    'datasets:approve',
    'datasets:reject',
    'datasets:request_changes',
    'datasets:update',
    'datasets:publish',
    'datasets:unpublish',
    'datasets:view',
    'datasets:proposals:view',
    'datasets:pick',
    'datasets:create',
  ],
  'Supplier Management': [
    'suppliers:invite',
    'suppliers:view',
    'suppliers:analytics',
    'suppliers:verify',
    'suppliers:suspend',
  ],
  'Catalog Management': [
    'categories:create',
    'categories:update',
    'categories:delete',
    'categories:view',
    'sources:create',
    'sources:update',
    'sources:delete',
    'sources:view',
  ],
  'User & Admin Management': [
    'users:view',
    'users:manage',
    'users:suspend',
    'users:delete',
    'admins:create',
    'admins:update',
    'admins:delete',
    'admins:roles:assign',
    'permissions:manage',
  ],
  'Reporting & Analytics': [
    'analytics:view',
    'reports:view',
    'reports:export',
  ],
};

function formatPermissionName(permission: string): string {
  return permission
    .split(':')
    .map(part => 
      part
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    )
    .join(' - ');
}

interface PermissionsCardProps {
  permissions: string[];
}

export function PermissionsCard({ permissions }: PermissionsCardProps) {
  return (
    <Card style={{ backgroundColor: 'var(--bg-base)' }}>
      <CardContent className="p-6 sticky top-4">
        <h2 className="mb-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
          My Permissions
        </h2>

        <div className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {permissions.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No permissions assigned
            </p>
          ) : (
            <>
              {Object.entries(PERMISSION_GROUPS).map(([group, groupPermissions]) => {
                const matchingPermissions = groupPermissions.filter((p: string) => 
                  permissions.includes(p)
                );

                if (matchingPermissions.length === 0) return null;

                return (
                  <div key={group}>
                    <Label
                      className="text-xs font-semibold mb-2 block"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {group}
                    </Label>
                    <div className="space-y-1">
                      {matchingPermissions.map((permission: string) => (
                        <div key={permission} className="flex items-center gap-2 py-1">
                          <div
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: 'var(--state-success)' }}
                          />
                          <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                            {formatPermissionName(permission)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Show raw permissions if they don't match groups */}
              {permissions.filter((p: string) =>
                !Object.values(PERMISSION_GROUPS).flat().includes(p)
              ).length > 0 && (
                <div>
                  <Label
                    className="text-xs font-semibold mb-2 block"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Other Permissions
                  </Label>
                  <div className="space-y-1">
                    {permissions
                      .filter((p: string) => !Object.values(PERMISSION_GROUPS).flat().includes(p))
                      .map((permission: string) => (
                        <div key={permission} className="flex items-center gap-2 py-1">
                          <div
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: 'var(--state-success)' }}
                          />
                          <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                            {formatPermissionName(permission)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
