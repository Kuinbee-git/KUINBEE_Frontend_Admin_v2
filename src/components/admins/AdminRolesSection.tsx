/**
 * AdminRolesSection - Manage role assignments for an admin
 */
'use client';
import { useState, useMemo } from 'react';
import { Shield, Plus, Save, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useRoles, useUpdateAdminRoles } from '@/hooks';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';

interface AdminRolesSectionProps {
  adminId: string;
  currentRoles: Array<{ roleId: string; name: string; displayName: string }>;
}

export function AdminRolesSection({ adminId, currentRoles }: AdminRolesSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    currentRoles.map((r) => r.roleId)
  );

  // Fetch all available roles
  const {
    data: rolesData,
    isLoading: rolesLoading,
    isError: rolesError,
    refetch: refetchRoles,
  } = useRoles({ isActive: true });
  const updateRolesMutation = useUpdateAdminRoles();

  const { can } = useAuthorization();
  const canAssignRoles = can({ anyOf: [PERMISSIONS.ROLES.ASSIGN] });

  const availableRoles = useMemo(() => {
    return rolesData?.items || [];
  }, [rolesData]);

  const handleToggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handleSave = async () => {
    try {
      await updateRolesMutation.mutateAsync({
        adminId,
        data: { roleIds: selectedRoleIds },
      });
      setIsEditing(false);
    } catch {
      // The mutation hook owns the user-facing error message.
    }
  };

  const handleStartEditing = () => {
    setSelectedRoleIds(currentRoles.map((role) => role.roleId));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setSelectedRoleIds(currentRoles.map((r) => r.roleId));
    setIsEditing(false);
  };

  const hasChanges = useMemo(() => {
    const current = new Set(currentRoles.map((r) => r.roleId));
    const selected = new Set(selectedRoleIds);

    if (current.size !== selected.size) return true;

    for (const id of current) {
      if (!selected.has(id)) return true;
    }
    return false;
  }, [currentRoles, selectedRoleIds]);

  return (
    <div
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: 'var(--bg-base)',
        borderColor: 'var(--border-default)',
      }}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Assigned Roles
          </h3>
        </div>

        {canAssignRoles && !isEditing ? (
          <Button onClick={handleStartEditing} variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Manage Roles
          </Button>
        ) : canAssignRoles && isEditing ? (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateRolesMutation.isPending}
              size="sm"
              className="gap-2"
              style={{
                backgroundColor: hasChanges ? 'var(--brand-primary)' : 'var(--bg-muted)',
                color: 'var(--brand-on-primary)',
              }}
            >
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
            <Button onClick={handleCancel} variant="outline" size="sm" className="gap-2">
              <XCircle className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          {rolesLoading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading roles...</p>
          ) : rolesError ? (
            <div
              className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              role="alert"
              style={{
                backgroundColor: 'var(--status-error-bg)',
                borderColor: 'var(--status-error-border)',
                color: 'var(--status-error)',
              }}
            >
              <span className="text-sm">Available roles could not be loaded.</span>
              <Button variant="outline" size="sm" onClick={() => refetchRoles()}>
                Retry
              </Button>
            </div>
          ) : availableRoles.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No roles available</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {availableRoles.map((role) => {
                const isSelected = selectedRoleIds.includes(role.id);
                return (
                  <div
                    key={role.id}
                    className="flex items-start gap-3 p-3 rounded border transition-colors"
                    style={{
                      backgroundColor: isSelected ? 'var(--brand-primary-bg)' : 'var(--bg-surface)',
                      borderColor: isSelected ? 'var(--brand-primary)' : 'var(--border-default)',
                    }}
                  >
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={isSelected}
                      onCheckedChange={() => handleToggleRole(role.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`role-${role.id}`}
                        className="font-medium cursor-pointer"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {role.displayName}
                      </Label>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {role.name}
                      </p>
                      {role.description && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          {role.description}
                        </p>
                      )}
                      {role.permissionCount !== undefined && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          {role.permissionCount} permissions
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedRoleIds.length > 0 && (
            <div className="mt-4 p-3 rounded" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Selected: {selectedRoleIds.length} role{selectedRoleIds.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {currentRoles && currentRoles.length > 0 ? (
            currentRoles.map((role) => (
              <div
                key={role.roleId}
                className="p-3 rounded border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                }}
              >
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {role.displayName}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {role.name}
                </p>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No roles assigned</p>
          )}
        </div>
      )}
    </div>
  );
}
