"use client";

import { useState, useEffect, useMemo } from "react";
import { KeyRound, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RoleListItem, CreateRoleRequest, UpdateRoleRequest } from "@/types";

// ============================================
// Create Role Dialog
// ============================================

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRoleRequest) => void;
  isLoading: boolean;
  allPermissions: string[];
  permissionsLoading: boolean;
}

export function CreateRoleDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  allPermissions,
  permissionsLoading,
}: CreateRoleDialogProps) {
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionSearch, setPermissionSearch] = useState("");

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setName("");
      setDisplayName("");
      setDescription("");
      setSelectedPermissions([]);
      setPermissionSearch("");
    }
  }, [open]);

  // Filter permissions by search
  const filteredPermissions = useMemo(() => {
    if (!permissionSearch) return allPermissions;
    return allPermissions.filter((p) =>
      p.toLowerCase().includes(permissionSearch.toLowerCase())
    );
  }, [allPermissions, permissionSearch]);

  // Group permissions by category
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, string[]> = {};
    filteredPermissions.forEach((permission) => {
      const [category] = permission.split(":");
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
    });
    return groups;
  }, [filteredPermissions]);

  const handlePermissionToggle = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleCategoryToggle = (category: string, permissions: string[]) => {
    const allSelected = permissions.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !permissions.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...permissions])]);
    }
  };

  const handleSubmit = () => {
    if (!name || !displayName) return;
    onSubmit({
      name: name.toUpperCase().replace(/\s+/g, "_"),
      displayName,
      description: description || undefined,
      permissions: selectedPermissions,
    });
  };

  const isValid = name && displayName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Create Role
          </DialogTitle>
          <DialogDescription>
            Create a new role with specific permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name (System)</Label>
              <Input
                id="name"
                placeholder="ROLE_NAME"
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Uppercase, underscores only
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="Role Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
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
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Permissions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Permissions ({selectedPermissions.length} selected)</Label>
              <div className="relative w-48">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <Input
                  placeholder="Search..."
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>
            
            {permissionsLoading ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Loading permissions...
              </p>
            ) : (
              <ScrollArea className="h-[200px] border rounded-md p-3" style={{ borderColor: "var(--border-default)" }}>
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        checked={permissions.every((p) => selectedPermissions.includes(p))}
                        onCheckedChange={() => handleCategoryToggle(category, permissions)}
                      />
                      <span className="font-medium text-sm capitalize" style={{ color: "var(--text-primary)" }}>
                        {category}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {permissions.filter((p) => selectedPermissions.includes(p)).length}/{permissions.length}
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
                            style={{ color: "var(--text-muted)" }}
                          >
                            {permission}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            style={{
              backgroundColor: "var(--brand-primary)",
              color: "#ffffff",
            }}
          >
            {isLoading ? "Creating..." : "Create Role"}
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
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Reset form when dialog opens or role changes
  // Load role data when dialog opens for editing
   
  useEffect(() => {
    if (open && role) {
      setDisplayName(role.displayName);
      setDescription(role.description || "");
      setIsActive(role.isActive);
    } else if (!open) {
      setDisplayName("");
      setDescription("");
      setIsActive(true);
    }
  }, [open, role]);

  const handleSubmit = () => {
    if (!displayName) return;
    onSubmit({
      displayName,
      description: description || null,
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
            Update role details for <code className="px-1 py-0.5 rounded bg-muted">{role.name}</code>
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
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
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
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Active Status</Label>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Inactive roles cannot be assigned to admins
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!displayName || isLoading}
            style={{
              backgroundColor: "var(--brand-primary)",
              color: "#ffffff",
            }}
          >
            {isLoading ? "Saving..." : "Save Changes"}
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
  onSubmit: (permissions: string[]) => void;
  isLoading: boolean;
  role: RoleListItem | null;
  currentPermissions: string[];
  allPermissions: string[];
  permissionsLoading: boolean;
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
}: ManagePermissionsDialogProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionSearch, setPermissionSearch] = useState("");

  // Populate permissions when dialog opens
  // Load current permissions when dialog opens
   
  useEffect(() => {
    if (open && currentPermissions) {
      setSelectedPermissions(currentPermissions);
    }
  }, [open, currentPermissions]);

  // Reset search when dialog closes
  // Reset permission search when dialog closes
   
  useEffect(() => {
    if (!open) {
      setPermissionSearch("");
    }
  }, [open]);

  // Filter permissions by search
  const filteredPermissions = useMemo(() => {
    if (!permissionSearch) return allPermissions;
    return allPermissions.filter((p) =>
      p.toLowerCase().includes(permissionSearch.toLowerCase())
    );
  }, [allPermissions, permissionSearch]);

  // Group permissions by category
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, string[]> = {};
    filteredPermissions.forEach((permission) => {
      const [category] = permission.split(":");
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
    });
    return groups;
  }, [filteredPermissions]);

  const handlePermissionToggle = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleCategoryToggle = (category: string, permissions: string[]) => {
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
                  style={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {perm}
                  <button
                    type="button"
                    aria-label="Remove permission"
                    onClick={() => handlePermissionToggle(perm)}
                    className="ml-2 text-muted-foreground hover:text-destructive focus:outline-none"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', lineHeight: 1 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <Input
              placeholder="Search permissions..."
              value={permissionSearch}
              onChange={(e) => setPermissionSearch(e.target.value)}
              className="pl-9"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Permissions count */}
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {selectedPermissions.length} of {allPermissions.length} permissions selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPermissions(allPermissions)}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPermissions([])}
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Permissions List */}
          {permissionsLoading ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Loading permissions...
            </p>
          ) : (
            <ScrollArea className="h-[300px] border rounded-md p-3" style={{ borderColor: "var(--border-default)" }}>
              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                <div key={category} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox
                      checked={permissions.every((p) => selectedPermissions.includes(p))}
                      onCheckedChange={() => handleCategoryToggle(category, permissions)}
                    />
                    <span className="font-medium text-sm capitalize" style={{ color: "var(--text-primary)" }}>
                      {category}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {permissions.filter((p) => selectedPermissions.includes(p)).length}/{permissions.length}
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
                          style={{ color: "var(--text-muted)" }}
                        >
                          {permission}
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
            disabled={isLoading}
            style={{
              backgroundColor: "var(--brand-primary)",
              color: "#ffffff",
            }}
          >
            {isLoading ? "Saving..." : "Save Permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
