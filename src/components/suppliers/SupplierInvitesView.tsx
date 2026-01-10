"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SupplierInvitesTable } from "./SupplierInvitesTable";
import { InviteSupplierDialog } from "./InviteSupplierDialog";
import { useSupplierInvites, useResendSupplierInvite } from "@/hooks/api/useSupplierInvites";
import type { SupplierInvite } from "@/types";

export function SupplierInvitesView() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data, isLoading } = useSupplierInvites();
  const resendMutation = useResendSupplierInvite();

  const handleResend = (invite: SupplierInvite) => {
    resendMutation.mutate(invite.id);
  };

  const invites = data?.items || [];

  return (
    <>
      <Card style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle style={{ color: "var(--text-primary)" }}>
                Supplier Invites
              </CardTitle>
              <CardDescription style={{ color: "var(--text-muted)" }}>
                Manage and send supplier invitation emails
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Mail className="w-4 h-4" />
              Invite Supplier
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
              Loading invites...
            </div>
          ) : invites.length === 0 ? (
            <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
              No invites sent yet. Click &quot;Invite Supplier&quot; to send your first invite.
            </div>
          ) : (
            <SupplierInvitesTable invites={invites} onResend={handleResend} />
          )}
        </CardContent>
      </Card>

      <InviteSupplierDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
