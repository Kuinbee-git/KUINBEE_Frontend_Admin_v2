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
  isPicked: boolean;
  onActionConfirm: (
    action: "approve" | "reject" | "request_changes",
    datasetNotes: string,
    pricingNotes?: string,
    datasetNeedsChanges?: boolean,
    pricingNeedsChanges?: boolean
  ) => void;
}

export function ReviewActions({
  canApprove,
  canReject,
  canRequestChanges,
  isPicked,
  onActionConfirm,
}: ReviewActionsProps) {
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [datasetNotes, setDatasetNotes] = useState("");
  const [pricingNotes, setPricingNotes] = useState("");
  const [datasetNeedsChanges, setDatasetNeedsChanges] = useState(false);
  const [pricingNeedsChanges, setPricingNeedsChanges] = useState(false);

  const handleActionClick = (action: ActionType) => {
    setActiveAction(action);
    setDatasetNotes("");
    setPricingNotes("");
    setDatasetNeedsChanges(false);
    setPricingNeedsChanges(false);
  };

  const handleConfirm = () => {
    if (!activeAction) return;

    // Validation logic for each action type
    if (activeAction === "request_changes") {
      // For request_changes, at least one checkbox must be selected
      if (!datasetNeedsChanges && !pricingNeedsChanges) {
        return;
      }
      // And datasetNotes must have content
      if (!datasetNotes.trim()) {
        return;
      }
    } else if (activeAction === "approve" || activeAction === "reject") {
      // For approve/reject, at least one checkbox must be selected
      if (!datasetNeedsChanges && !pricingNeedsChanges) {
        return;
      }
      // And at least one of the notes fields should have content if that item is selected
      if ((datasetNeedsChanges && !datasetNotes.trim()) || (pricingNeedsChanges && !pricingNotes.trim())) {
        return;
      }
    }

    onActionConfirm(
      activeAction,
      datasetNotes,
      pricingNotes,
      datasetNeedsChanges,
      pricingNeedsChanges
    );
    setActiveAction(null);
    setDatasetNotes("");
    setPricingNotes("");
    setDatasetNeedsChanges(false);
    setPricingNeedsChanges(false);
  };

  const handleCancel = () => {
    setActiveAction(null);
    setDatasetNotes("");
    setPricingNotes("");
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

  // Only show actions if the proposal has been picked by an admin
  if (!isPicked) {
    return (
      <div className="text-center p-4">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          This proposal needs to be assigned to an admin before review actions can be taken.
        </p>
      </div>
    );
  }

  if (availableActions.length === 0) {
    return null;
  }

  const isConfirmDisabled = (() => {
    if (!activeAction) return true;

    if (activeAction === "request_changes") {
      return !datasetNotes.trim() || (!datasetNeedsChanges && !pricingNeedsChanges);
    }

    if (activeAction === "approve" || activeAction === "reject") {
      if (!datasetNeedsChanges && !pricingNeedsChanges) return true;
      if (datasetNeedsChanges && !datasetNotes.trim()) return true;
      if (pricingNeedsChanges && !pricingNotes.trim()) return true;
      return false;
    }

    return true;
  })();

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
                "Select which items to approve. Each selected item requires approval notes."}
              {activeAction === "reject" &&
                "Select which items to reject. Each selected item requires a rejection reason."}
              {activeAction === "request_changes" &&
                "Select what needs changes and provide feedback. The supplier can edit and resubmit."}
            </p>
          </div>

          {/* Checkboxes for approve, reject, and request_changes */}
          {(activeAction === "approve" || activeAction === "reject" || activeAction === "request_changes") && (
            <div
              className="p-4 rounded-lg space-y-3"
              style={{ backgroundColor: "var(--bg-surface)" }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {activeAction === "request_changes"
                  ? "What needs to change?"
                  : activeAction === "approve"
                  ? "What would you like to approve?"
                  : "What would you like to reject?"}
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="dataset-action"
                    checked={datasetNeedsChanges}
                    onCheckedChange={(checked) => setDatasetNeedsChanges(checked as boolean)}
                    style={{ accentColor: activeAction === "request_changes" ? "var(--state-warning)" : activeAction === "approve" ? "var(--state-success)" : "var(--state-error)" }}
                  />
                  <Label htmlFor="dataset-action" className="cursor-pointer text-sm" style={{ color: "var(--text-primary)" }}>
                    {activeAction === "request_changes"
                      ? "Dataset needs revision"
                      : activeAction === "approve"
                      ? "Approve Dataset"
                      : "Reject Dataset"}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pricing-action"
                    checked={pricingNeedsChanges}
                    onCheckedChange={(checked) => setPricingNeedsChanges(checked as boolean)}
                    style={{ accentColor: activeAction === "request_changes" ? "var(--state-warning)" : activeAction === "approve" ? "var(--state-success)" : "var(--state-error)" }}
                  />
                  <Label htmlFor="pricing-action" className="cursor-pointer text-sm" style={{ color: "var(--text-primary)" }}>
                    {activeAction === "request_changes"
                      ? "Pricing needs revision"
                      : activeAction === "approve"
                      ? "Approve Pricing"
                      : "Reject Pricing"}
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Dataset Notes */}
          {(activeAction === "approve" || activeAction === "reject" || (activeAction === "request_changes" && datasetNeedsChanges)) && (
            <div>
              <Label className="mb-2 block" style={{ color: "var(--text-primary)" }}>
                {activeAction === "approve"
                  ? "Dataset Approval Notes"
                  : activeAction === "reject"
                  ? "Dataset Rejection Reason"
                  : "Dataset Feedback"}
                {(activeAction !== "approve" || (activeAction === "approve" && datasetNeedsChanges)) && (
                  <span style={{ color: "var(--state-error)" }}> *</span>
                )}
              </Label>
              <Textarea
                value={datasetNotes}
                onChange={(e) => setDatasetNotes(e.target.value)}
                placeholder={
                  activeAction === "approve"
                    ? "Add notes about the dataset approval..."
                    : activeAction === "reject"
                    ? "Explain why the dataset is being rejected..."
                    : "Describe what needs to be fixed in the dataset..."
                }
                rows={3}
                className="w-full"
                style={{
                  backgroundColor: "var(--bg-base)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border-default)",
                }}
              />
            </div>
          )}

          {/* Pricing Notes */}
          {(activeAction === "approve" || activeAction === "reject" || (activeAction === "request_changes" && pricingNeedsChanges)) && (
            <div>
              <Label className="mb-2 block" style={{ color: "var(--text-primary)" }}>
                {activeAction === "approve"
                  ? "Pricing Approval Notes"
                  : activeAction === "reject"
                  ? "Pricing Rejection Reason"
                  : "Pricing Feedback"}
                {(activeAction !== "approve" || (activeAction === "approve" && pricingNeedsChanges)) && (
                  <span style={{ color: "var(--state-error)" }}> *</span>
                )}
              </Label>
              <Textarea
                value={pricingNotes}
                onChange={(e) => setPricingNotes(e.target.value)}
                placeholder={
                  activeAction === "approve"
                    ? "Add notes about the pricing approval..."
                    : activeAction === "reject"
                    ? "Explain why the pricing is being rejected..."
                    : "Describe what needs to be fixed in the pricing..."
                }
                rows={3}
                className="w-full"
                style={{
                  backgroundColor: "var(--bg-base)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border-default)",
                }}
              />
            </div>
          )}

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
