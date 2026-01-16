import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const PERMISSION_GROUPS: Record<string, string[]> = {
  'Categories': [
    'CREATE_CATEGORY',
    'UPDATE_CATEGORY',
    'DELETE_CATEGORY',
    'VIEW_CATEGORY',
  ],
  'Sources': [
    'CREATE_SOURCE',
    'UPDATE_SOURCE',
    'DELETE_SOURCE',
    'VIEW_SOURCE',
  ],
  'Datasets': [
    'CREATE_PLATFORM_DATASET',
    'UPDATE_PLATFORM_DATASET',
    'DELETE_PLATFORM_DATASET',
    'VIEW_PLATFORM_DATASETS',
    'APPROVE_DATASET',
    'REJECT_DATASET',
    'REQUEST_DATASET_CHANGES',
    'PUBLISH_DATASET',
    'UNPUBLISH_DATASET',
    'VIEW_DATASET_PROPOSALS',
  ],
  'Suppliers': [
    'VIEW_SUPPLIER_ANALYTICS',
    'VIEW_SUPPLIERS',
    'INVITE_SUPPLIER',
    'CREATE_SUPPLIER',
    'UPDATE_SUPPLIER',
    'DELETE_SUPPLIER',
    'VERIFY_SUPPLIER',
    'SUSPEND_SUPPLIER',
  ],
  'Users': [
    'VIEW_USERS',
    'VIEW_USER_ANALYTICS',
    'UPDATE_USER',
    'DELETE_USER',
    'SUSPEND_USER',
  ],
  'Admins': [
    'VIEW_ADMINS',
    'CREATE_ADMIN',
    'UPDATE_ADMIN',
    'DELETE_ADMIN',
  ],
  'Roles': [
    'VIEW_ROLES',
    'CREATE_ROLE',
    'UPDATE_ROLE',
    'DELETE_ROLE',
  ],
};

function formatPermissionName(permission: string): string {
  return permission
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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
