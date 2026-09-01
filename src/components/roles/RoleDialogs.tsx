'use client';

import { useState, useMemo } from 'react';
import { AlertCircle, KeyRound, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RoleListItem, CreateRoleRequest, UpdateRoleRequest } from '@/types';
import { PERMISSION_GROUPS, PERMISSION_LABELS, type Permission } from '@/lib/constants/permissions';

function groupPermissions(
  permissions: readonly Permission[],
  search: string
): Record<string, Permission[]> {
  const query = search.trim().toLowerCase();
  const available = new Set(permissions);

  return PERMISSION_GROUPS.reduce<Record<string, Permission[]>>((groups, group) => {
    const matchingPermissions = group.permissions.filter(
      (permission) =>
        available.has(permission) &&
        (!query ||
          permission.toLowerCase().includes(query) ||
          PERMISSION_LABELS[permission].toLowerCase().includes(query))
    );

    if (matchingPermissions.length > 0) {
      groups[group.label] = matchingPermissions;
    }

    return groups;
  }, {});
}

// ============================================
// Create Role Dialog
// ============================================

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRoleRequest) => void;
  isLoading: boolean;
  allPermissions: Permission[];
  permissionsLoading: boolean;
  permissionsError: boolean;
  onRetryPermissions: () => void;
}

export function CreateRoleDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  allPermissions,
  permissionsLoading,
  permissionsError,
  onRetryPermissions,
}: CreateRoleDialogProps) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [permissionSearch, setPermissionSearch] = useState('');

  // Filter permissions by search
  const filteredPermissions = useMemo(() => {
    if (!permissionSearch) return allPermissions;
    return allPermissions.filter(
      (permission) =>
        permission.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        PERMISSION_LABELS[permission].toLowerCase().includes(permissionSearch.toLowerCase())
    );
  }, [allPermissions, permissionSearch]);

  // Group permissions by category
  const groupedPermissions = useMemo(() => {
    return groupPermissions(filteredPermissions, '');
  }, [filteredPermissions]);

  const handlePermissionToggle = (permission: Permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  };

  const handleCategoryToggle = (permissions: Permission[]) => {
    const allSelected = permissions.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !permissions.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...permissions])]);
    }
  };

  const handleSubmit = () => {
    const normalizedName = name.trim().toUpperCase().replace(/\s+/g, '_');
    const normalizedDisplayName = displayName.trim();
    if (
      normalizedName.length < 3 ||
      normalizedName.length > 50 ||
      !/^[A-Z][A-Z0-9_]*$/.test(normalizedName) ||
      !normalizedDisplayName ||
      normalizedDisplayName.length > 100 ||
      description.trim().length > 1000 ||
      selectedPermissions.length === 0
    )
      return;
    onSubmit({
      name: normalizedName,
      displayName: normalizedDisplayName,
      description: description.trim() || undefined,
      permissions: selectedPermissions,
    });
  };

  const isValid =
    name.trim().length >= 3 &&
    name.trim().length <= 50 &&
    /^[A-Z][A-Z0-9_]*$/.test(name.trim()) &&
    displayName.trim().length > 0 &&
    displayName.trim().length <= 100 &&
    description.trim().length <= 1000 &&
    selectedPermissions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Create Role
          </DialogTitle>
          <DialogDescription>Create a new role with specific permissions.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name (System)</Label>
              <Input
                id="name"
                placeholder="ROLE_NAME"
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                      .toUpperCase()
                      .replace(/\s+/g, '_')
                      .replace(/[^A-Z0-9_]/g, '')
                  )
                }
                maxLength={50}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                3–50 characters; uppercase convention with underscores
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="Role Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={100}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this role can do..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={1000}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Permissions */}
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium" id="permission-selection-label">
                Permissions ({selectedPermissions.length} selected)
              </span>
              <div className="relative w-full sm:w-48">
                <Search
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--text-muted)' }}
                />
                <Input
                  aria-label="Search permissions"
                  placeholder="Search..."
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            {permissionsLoading ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Loading permissions...
              </p>
            ) : permissionsError ? (
              <div className="rounded-md border border-[var(--status-error-border)] bg-[var(--status-error-bg)] p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-error)]"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--status-error)]">
                      Could not load permissions
                    </p>
                    <Button
                      className="mt-3"
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={onRetryPermissions}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <ScrollArea
                role="group"
                aria-labelledby="permission-selection-label"
                className="h-[200px] border rounded-md p-3"
                style={{ borderColor: 'var(--border-default)' }}
              >
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        aria-label={`Toggle all ${category} permissions`}
                        checked={permissions.every((p) => selectedPermissions.includes(p))}
                        onCheckedChange={() => handleCategoryToggle(permissions)}
                      />
                      <span
                        className="font-medium text-sm capitalize"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {category}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {permissions.filter((p) => selectedPermissions.includes(p)).length}/
                        {permissions.length}
                      </Badge>
                    </div>
                    <div className="ml-6 space-y-1">
                      {permissions.map((permission) => (
                        <div key={permission} className="flex items-center gap-2">
                          <Checkbox
                            id={permission}
                            checked={selectedPermissions.includes(permission)}
                            onCheckedChange={() => handlePermissionToggle(permission)}
                          />
                          <label
                            htmlFor={permission}
                            className="text-sm cursor-pointer"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {PERMISSION_LABELS[permission]}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            )}
            {!permissionsLoading && !permissionsError && selectedPermissions.length === 0 ? (
              <p className="text-xs text-[var(--status-error)]">Select at least one permission.</p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isLoading || permissionsLoading || permissionsError}
            style={{
              backgroundColor: 'var(--brand-primary)',
              color: 'var(--brand-on-primary)',
            }}
          >
            {isLoading ? 'Creating...' : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Edit Role Dialog
// ============================================

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UpdateRoleRequest) => void;
  isLoading: boolean;
  role: RoleListItem | null;
}

export function EditRoleDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  role,
}: EditRoleDialogProps) {
  const [displayName, setDisplayName] = useState(() => role?.displayName ?? '');
  const [description, setDescription] = useState(() => role?.description ?? '');
  const [isActive, setIsActive] = useState(() => role?.isActive ?? true);

  const handleSubmit = () => {
    const normalizedDisplayName = displayName.trim();
    const normalizedDescription = description.trim();
    if (
      !normalizedDisplayName ||
      normalizedDisplayName.length > 100 ||
      normalizedDescription.length > 1000
    )
      return;
    onSubmit({
      displayName: normalizedDisplayName,
      description: normalizedDescription || null,
      isActive,
    });
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Edit Role
          </DialogTitle>
          <DialogDescription>
            Update role details for{' '}
            <code className="px-1 py-0.5 rounded bg-muted">{role.name}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="editDisplayName">Display Name</Label>
            <Input
              id="editDisplayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="editDescription">Description</Label>
            <Textarea
              id="editDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={1000}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="edit-role-active">Active Status</Label>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Inactive roles cannot be assigned to admins
              </p>
            </div>
            <Switch id="edit-role-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!displayName.trim() || isLoading}
            style={{
              backgroundColor: 'var(--brand-primary)',
              color: 'var(--brand-on-primary)',
            }}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Manage Permissions Dialog
// ============================================

interface ManagePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (permissions: Permission[]) => void;
  isLoading: boolean;
  role: RoleListItem | null;
  currentPermissions: Permission[];
  allPermissions: Permission[];
  permissionsLoading: boolean;
  permissionsError: boolean;
  onRetryPermissions: () => void;
}

export function ManagePermissionsDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  role,
  currentPermissions,
  allPermissions,
  permissionsLoading,
  permissionsError,
  onRetryPermissions,
}: ManagePermissionsDialogProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    () => currentPermissions
  );
  const [permissionSearch, setPermissionSearch] = useState('');

  // Filter permissions by search
  const filteredPermissions = useMemo(() => {
    if (!permissionSearch) return allPermissions;
    return allPermissions.filter(
      (permission) =>
        permission.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        PERMISSION_LABELS[permission].toLowerCase().includes(permissionSearch.toLowerCase())
    );
  }, [allPermissions, permissionSearch]);

  // Group permissions by category
  const groupedPermissions = useMemo(() => {
    return groupPermissions(filteredPermissions, '');
  }, [filteredPermissions]);

  const handlePermissionToggle = (permission: Permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  };

  const handleCategoryToggle = (permissions: Permission[]) => {
    const allSelected = permissions.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !permissions.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...permissions])]);
    }
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Manage Permissions
          </DialogTitle>
          <DialogDescription>
            Update permissions for <strong>{role.displayName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selected Permissions Pills */}
          {selectedPermissions.length > 0 && (
            <div
              className="flex flex-wrap gap-2 mb-2 overflow-x-auto"
              style={{
                maxHeight: 96,
                minHeight: 40,
                paddingBottom: 4,
                marginBottom: 8,
                borderBottom: '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
              }}
            >
              {selectedPermissions.map((perm) => (
                <span
                  key={perm}
                  className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-primary border border-border shadow-sm transition-colors"
                  style={{
                    maxWidth: 220,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {perm}
                  <button
                    type="button"
                    aria-label={`Remove permission ${PERMISSION_LABELS[perm]}`}
                    onClick={() => handlePermissionToggle(perm)}
                    className="ml-2 rounded-sm text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--text-muted)' }}
            />
            <Input
              aria-label="Search permissions"
              placeholder="Search permissions..."
              value={permissionSearch}
              onChange={(e) => setPermissionSearch(e.target.value)}
              className="pl-9"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Permissions count */}
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {selectedPermissions.length} of {allPermissions.length} permissions selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPermissions(allPermissions)}
                disabled={permissionsLoading}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPermissions([])}
                disabled={permissionsLoading}
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Permissions List */}
          {permissionsLoading ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Loading permissions...
            </p>
          ) : permissionsError ? (
            <div className="rounded-md border border-[var(--status-error-border)] bg-[var(--status-error-bg)] p-4">
              <p className="text-sm font-medium text-[var(--status-error)]">
                Could not load this role&apos;s permissions
              </p>
              <Button
                className="mt-3"
                type="button"
                size="sm"
                variant="outline"
                onClick={onRetryPermissions}
              >
                Retry
              </Button>
            </div>
          ) : (
            <ScrollArea
              className="h-[300px] border rounded-md p-3"
              style={{ borderColor: 'var(--border-default)' }}
            >
              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                <div key={category} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox
                      checked={permissions.every((p) => selectedPermissions.includes(p))}
                      onCheckedChange={() => handleCategoryToggle(permissions)}
                    />
                    <span
                      className="font-medium text-sm capitalize"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {category}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {permissions.filter((p) => selectedPermissions.includes(p)).length}/
                      {permissions.length}
                    </Badge>
                  </div>
                  <div className="ml-6 space-y-1">
                    {permissions.map((permission) => (
                      <div key={permission} className="flex items-center gap-2">
                        <Checkbox
                          id={`manage-${permission}`}
                          checked={selectedPermissions.includes(permission)}
                          onCheckedChange={() => handlePermissionToggle(permission)}
                        />
                        <label
                          htmlFor={`manage-${permission}`}
                          className="text-sm cursor-pointer"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {PERMISSION_LABELS[permission]}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(selectedPermissions)}
            disabled={
              isLoading ||
              permissionsLoading ||
              permissionsError ||
              selectedPermissions.length === 0
            }
            style={{
              backgroundColor: 'var(--brand-primary)',
              color: 'var(--brand-on-primary)',
            }}
          >
            {isLoading ? 'Saving...' : 'Save Permissions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
