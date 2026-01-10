"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Invite, Role } from "@/types";

// ============================================
// Create Invite Dialog
// ============================================

interface CreateInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { email: string; roleIds: string[]; expiresInHours: number; sendEmail: boolean }) => void;
  isLoading: boolean;
  roles: Role[];
  rolesLoading: boolean;
}

export function CreateInviteDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  roles,
  rolesLoading,
}: CreateInviteDialogProps) {
  const [email, setEmail] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [expiresInHours, setExpiresInHours] = useState("168"); // 7 days default
  const [sendEmail, setSendEmail] = useState(true);

  // Reset form when dialog closes
  // Reset form when dialog closes
   
  useEffect(() => {
    if (!open) {
      setEmail("");
      setSelectedRoleIds([]);
      setExpiresInHours("168");
      setSendEmail(true);
    }
  }, [open]);

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSubmit = () => {
    if (!email || selectedRoleIds.length === 0) return;
    onSubmit({
      email,
      roleIds: selectedRoleIds,
      expiresInHours: parseInt(expiresInHours, 10),
      sendEmail,
    });
  };

  const isValid = email && selectedRoleIds.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invite Admin
          </DialogTitle>
          <DialogDescription>
            Send an invitation email to a new admin user. They will receive a link to create their account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Roles */}
          <div className="space-y-2">
            <Label>Assign Roles</Label>
            {rolesLoading ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Loading roles...
              </p>
            ) : roles.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No roles available
              </p>
            ) : (
              <div
                className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-default)",
                }}
              >
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={role.id}
                      checked={selectedRoleIds.includes(role.id)}
                      onCheckedChange={() => handleRoleToggle(role.id)}
                    />
                    <label
                      htmlFor={role.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {role.displayName || role.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
            {selectedRoleIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedRoleIds.map((roleId) => {
                  const role = roles.find((r) => r.id === roleId);
                  return (
                    <Badge
                      key={roleId}
                      variant="secondary"
                      className="gap-1"
                    >
                      {role?.displayName || role?.name}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => handleRoleToggle(roleId)}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Expiry */}
          <div className="space-y-2">
            <Label htmlFor="expires">Invite Expires In</Label>
            <Select value={expiresInHours} onValueChange={setExpiresInHours}>
              <SelectTrigger
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="48">48 hours</SelectItem>
                <SelectItem value="72">3 days</SelectItem>
                <SelectItem value="168">7 days</SelectItem>
                <SelectItem value="336">14 days</SelectItem>
                <SelectItem value="720">30 days</SelectItem>
              </SelectContent>
            </Select>

          {/* Send Email Toggle */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="sendEmail"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(checked as boolean)}
            />
            <label
              htmlFor="sendEmail"
              className="text-sm font-medium leading-none cursor-pointer"
              style={{ color: "var(--text-primary)" }}
            >
              Send invitation email immediately
            </label>
          </div>
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
            {isLoading ? "Sending..." : "Send Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Resend Invite Dialog
// ============================================

interface ResendInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
  invite: Invite | null;
}

export function ResendInviteDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  invite,
}: ResendInviteDialogProps) {
  if (!invite) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Resend Invite
          </DialogTitle>
          <DialogDescription>
            This will send a new invitation email to the user.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p style={{ color: "var(--text-primary)" }}>
            Resend invitation to <strong>{invite.email}</strong>?
          </p>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            This invite has been sent {invite.resendCount} time(s) before.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              backgroundColor: "var(--brand-primary)",
              color: "#ffffff",
            }}
          >
            {isLoading ? "Sending..." : "Resend"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Cancel Invite Dialog
// ============================================

interface CancelInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
  invite: Invite | null;
}

export function CancelInviteDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  invite,
}: CancelInviteDialogProps) {
  if (!invite) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Cancel Invite
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The invitation link will no longer work.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p style={{ color: "var(--text-primary)" }}>
            Are you sure you want to cancel the invitation for <strong>{invite.email}</strong>?
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep Invite
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Cancelling..." : "Cancel Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
