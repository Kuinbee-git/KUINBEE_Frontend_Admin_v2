"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

type ActionType = "approve" | "reject" | "request_changes" | null;

interface ReviewActionsProps {
  currentStatus: string;
  ownerType: "platform" | "supplier";
  canApprove: boolean;
  canReject: boolean;
  canRequestChanges: boolean;
  onActionConfirm: (action: "approve" | "reject" | "request_changes", notes: string) => void;
}

export function ReviewActions({
  canApprove,
  canReject,
  canRequestChanges,
  onActionConfirm,
}: ReviewActionsProps) {
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [actionNotes, setActionNotes] = useState("");

  const handleActionClick = (action: ActionType) => {
    setActiveAction(action);
    setActionNotes("");
  };

  const handleConfirm = () => {
    if (activeAction && actionNotes.trim()) {
      onActionConfirm(activeAction, actionNotes);
      setActiveAction(null);
      setActionNotes("");
    }
  };

  const handleCancel = () => {
    setActiveAction(null);
    setActionNotes("");
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "approve":
        return "Approve Dataset";
      case "reject":
        return "Reject Dataset";
      case "request_changes":
        return "Request Changes";
      default:
        return "";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "approve":
        return <CheckCircle className="w-4 h-4" />;
      case "reject":
        return <XCircle className="w-4 h-4" />;
      case "request_changes":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getActionStyle = (action: string) => {
    switch (action) {
      case "approve":
        return {
          backgroundColor: "var(--state-success)",
          color: "#FFFFFF",
        };
      case "reject":
        return {
          backgroundColor: "var(--state-error)",
          color: "#FFFFFF",
        };
      case "request_changes":
        return {
          backgroundColor: "var(--state-warning)",
          color: "#FFFFFF",
        };
      default:
        return {};
    }
  };

  const availableActions = [
    { action: "approve" as const, canPerform: canApprove },
    { action: "reject" as const, canPerform: canReject },
    { action: "request_changes" as const, canPerform: canRequestChanges },
  ].filter((item) => item.canPerform);

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <div
      className="p-6 rounded-lg"
      style={{
        backgroundColor: "var(--bg-base)",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h2 className="mb-4" style={{ color: "var(--text-primary)" }}>Review Actions</h2>

      {!activeAction ? (
        <div className="flex gap-3">
          {availableActions.map(({ action }) => (
            action && (
              <Button
                key={action}
                onClick={() => handleActionClick(action)}
                style={getActionStyle(action)}
              >
                {getActionIcon(action)}
                {getActionLabel(action)}
              </Button>
            )
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className="p-4 rounded-lg border-l-4"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderLeftColor: activeAction === "approve"
                ? "var(--state-success)"
                : activeAction === "reject"
                ? "var(--state-error)"
                : "var(--state-warning)",
            }}
          >
            <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              {getActionLabel(activeAction)}
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {activeAction === "approve" &&
                "This will approve the dataset and make it available in the marketplace."}
              {activeAction === "reject" &&
                "This will reject the dataset. The supplier will be notified of your decision."}
              {activeAction === "request_changes" &&
                "This will send the dataset back to the supplier with your requested changes."}
            </p>
          </div>

          <div>
            <Label className="mb-2 block" style={{ color: "var(--text-primary)" }}>
              {activeAction === "approve" ? "Approval Notes" : activeAction === "reject" ? "Rejection Reason" : "Requested Changes"}
              <span style={{ color: "var(--state-error)" }}> *</span>
            </Label>
            <Textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder={
                activeAction === "approve"
                  ? "Add any notes about this approval..."
                  : activeAction === "reject"
                  ? "Explain why this dataset is being rejected..."
                  : "Describe what changes are needed..."
              }
              rows={4}
              className="w-full"
              style={{
                backgroundColor: "var(--bg-base)",
                color: "var(--text-primary)",
                borderColor: "var(--border-default)",
              }}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleConfirm}
              disabled={!actionNotes.trim()}
              style={getActionStyle(activeAction)}
            >
              Confirm {activeAction === "approve" ? "Approval" : activeAction === "reject" ? "Rejection" : "Request"}
            </Button>
            <Button
              onClick={handleCancel}
              style={{
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-primary)",
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
