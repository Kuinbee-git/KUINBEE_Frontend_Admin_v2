import { Card, CardContent } from '@/components/ui/card';
import { PERMISSION_GROUPS, PERMISSION_LABELS, type Permission } from '@/lib/constants/permissions';

interface PermissionsCardProps {
  permissions: Permission[];
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
              {PERMISSION_GROUPS.map((group) => {
                const matchingPermissions = group.permissions.filter((permission) =>
                  permissions.includes(permission)
                );

                if (matchingPermissions.length === 0) return null;

                return (
                  <section key={group.id} aria-labelledby={`permission-group-${group.id}`}>
                    <h3
                      id={`permission-group-${group.id}`}
                      className="mb-2 text-xs font-semibold"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {group.label}
                    </h3>
                    <div className="space-y-1">
                      {matchingPermissions.map((permission) => (
                        <div key={permission} className="flex items-center gap-2 py-1">
                          <div
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: 'var(--state-success)' }}
                          />
                          <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                            {PERMISSION_LABELS[permission]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
