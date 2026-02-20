"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

type ActionType = "approve" | "reject" | "request_changes" | null;

interface ReviewActionsProps {
  currentStatus: string;
  ownerType: "platform" | "supplier";
  canApprove: boolean;
  canReject: boolean;
  canRequestChanges: boolean;
  onActionConfirm: (
    action: "approve" | "reject" | "request_changes",
    notes: string,
    datasetNeedsChanges?: boolean,
    pricingNeedsChanges?: boolean
  ) => void;
}

export function ReviewActions({
  canApprove,
  canReject,
  canRequestChanges,
  onActionConfirm,
}: ReviewActionsProps) {
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [datasetNeedsChanges, setDatasetNeedsChanges] = useState(false);
  const [pricingNeedsChanges, setPricingNeedsChanges] = useState(false);

  const handleActionClick = (action: ActionType) => {
    setActiveAction(action);
    setActionNotes("");
    setDatasetNeedsChanges(false);
    setPricingNeedsChanges(false);
  };

  const handleConfirm = () => {
    if (activeAction && actionNotes.trim()) {
      // If request_changes, at least one checkbox must be selected
      if (activeAction === "request_changes" && !datasetNeedsChanges && !pricingNeedsChanges) {
        return;
      }
      onActionConfirm(
        activeAction,
        actionNotes,
        datasetNeedsChanges,
        pricingNeedsChanges
      );
      setActiveAction(null);
      setActionNotes("");
      setDatasetNeedsChanges(false);
      setPricingNeedsChanges(false);
    }
  };

  const handleCancel = () => {
    setActiveAction(null);
    setActionNotes("");
    setDatasetNeedsChanges(false);
    setPricingNeedsChanges(false);
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "approve":
        return "Approve Dataset & Pricing";
      case "reject":
        return "Reject Dataset & Pricing";
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

  const isConfirmDisabled =
    !actionNotes.trim() ||
    (activeAction === "request_changes" && !datasetNeedsChanges && !pricingNeedsChanges);

  return (
    <div
      className="p-4 md:p-6 rounded-lg"
      style={{
        backgroundColor: "var(--bg-base)",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Review Actions</h2>

      {!activeAction ? (
        <div className="flex flex-col gap-3">
          {availableActions.map(({ action }) => (
            action && (
              <Button
                key={action}
                onClick={() => handleActionClick(action)}
                style={getActionStyle(action)}
                className="w-full justify-center gap-2"
              >
                {getActionIcon(action)}
                <span>{getActionLabel(action)}</span>
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
                "This will approve both the dataset and pricing. Both will be locked and the dataset will be ready for publication."}
              {activeAction === "reject" &&
                "This will reject both the dataset and pricing. The supplier will need to submit a fresh version."}
              {activeAction === "request_changes" &&
                "Select what needs changes and provide feedback. The supplier can edit and resubmit."}
            </p>
          </div>

          {/* Request Changes Checkboxes */}
          {activeAction === "request_changes" && (
            <div
              className="p-4 rounded-lg space-y-3"
              style={{ backgroundColor: "var(--bg-surface)" }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                What needs to change?
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="dataset-needs-changes"
                    checked={datasetNeedsChanges}
                    onCheckedChange={(checked) => setDatasetNeedsChanges(checked as boolean)}
                    style={{ accentColor: "var(--state-warning)" }}
                  />
                  <Label htmlFor="dataset-needs-changes" className="cursor-pointer text-sm" style={{ color: "var(--text-primary)" }}>
                    Dataset needs revision
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pricing-needs-changes"
                    checked={pricingNeedsChanges}
                    onCheckedChange={(checked) => setPricingNeedsChanges(checked as boolean)}
                    style={{ accentColor: "var(--state-warning)" }}
                  />
                  <Label htmlFor="pricing-needs-changes" className="cursor-pointer text-sm" style={{ color: "var(--text-primary)" }}>
                    Pricing needs revision
                  </Label>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label className="mb-2 block" style={{ color: "var(--text-primary)" }}>
              {activeAction === "approve"
                ? "Approval Notes (optional)"
                : activeAction === "reject"
                ? "Rejection Reason"
                : "Feedback for Supplier"}
              {activeAction !== "approve" && (
                <span style={{ color: "var(--state-error)" }}> *</span>
              )}
            </Label>
            <Textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder={
                activeAction === "approve"
                  ? "Add any notes about this approval..."
                  : activeAction === "reject"
                  ? "Explain why this dataset is being rejected..."
                  : "Describe what needs to be fixed..."
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

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              style={getActionStyle(activeAction)}
              className="flex-1 sm:flex-none"
            >
              Confirm {activeAction === "approve" ? "Approval" : activeAction === "reject" ? "Rejection" : "Request"}
            </Button>
            <Button
              onClick={handleCancel}
              style={{
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-primary)",
              }}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
