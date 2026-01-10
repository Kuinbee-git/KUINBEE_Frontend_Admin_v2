"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InviteAuditView } from "@/components/audit/InviteAuditView";
import { AdminRoleAuditView } from "@/components/audit/AdminRoleAuditView";
import { RolePermissionAuditView } from "@/components/audit/RolePermissionAuditView";
import { Shield, Users, Key } from "lucide-react";

export default function AuditPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-surface)" }}>
      {/* Page Header */}
      <div
        className="p-6 border-b"
        style={{
          backgroundColor: "var(--bg-base)",
          borderColor: "var(--border-default)",
        }}
      >
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Audit Logs
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Track and review all administrative actions and changes
        </p>
      </div>

      {/* Tabs */}
      <div className="p-6">
        <Tabs defaultValue="invites" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="invites" className="gap-2">
              <Users className="w-4 h-4" />
              Invite Activity
            </TabsTrigger>
            <TabsTrigger value="admin-roles" className="gap-2">
              <Shield className="w-4 h-4" />
              Role Assignments
            </TabsTrigger>
            <TabsTrigger value="role-permissions" className="gap-2">
              <Key className="w-4 h-4" />
              Permission Changes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invites">
            <InviteAuditView />
          </TabsContent>

          <TabsContent value="admin-roles">
            <AdminRoleAuditView />
          </TabsContent>

          <TabsContent value="role-permissions">
            <RolePermissionAuditView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
