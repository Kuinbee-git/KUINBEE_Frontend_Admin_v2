"use client";

import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, getDatasetStatusSemantic, getVerificationStatusSemantic } from "@/components/shared/StatusBadge";
import type { ProposalListItem } from "./ProposalsView";

interface ProposalTableProps {
  proposals: ProposalListItem[];
  onRowClick: (datasetId: string) => void;
  onPickProposal?: (datasetId: string, e: React.MouseEvent) => void;
}

export function ProposalTable({ proposals, onRowClick, onPickProposal }: ProposalTableProps) {
  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <table className="w-full">
      <thead>
        <tr
          className="border-b text-left text-xs"
          style={{
            borderColor: "var(--border-default)",
            color: "var(--text-muted)",
          }}
        >
          <th className="p-4 font-medium">Dataset</th>
          <th className="p-4 font-medium">Supplier</th>
          <th className="p-4 font-medium">Category</th>
          <th className="p-4 font-medium">Status</th>
          <th className="p-4 font-medium">Verification</th>
          <th className="p-4 font-medium">Submitted</th>
          <th className="p-4 font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {proposals.map((proposal) => (
          <tr
            key={proposal.id}
            className="border-b cursor-pointer transition-colors hover:bg-[var(--bg-surface)]"
            style={{ borderColor: "var(--border-default)" }}
            onClick={() => onRowClick(proposal.datasetUniqueId)}
          >
            <td className="p-4">
              <div>
                <p
                  className="font-medium text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {proposal.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {proposal.datasetUniqueId}
                </p>
              </div>
            </td>
            <td className="p-4">
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                {proposal.supplierName}
              </p>
            </td>
            <td className="p-4">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {proposal.category}
              </p>
            </td>
            <td className="p-4">
              <StatusBadge
                status={formatStatus(proposal.status)}
                semanticType={getDatasetStatusSemantic(proposal.status)}
              />
            </td>
            <td className="p-4">
              <StatusBadge
                status={formatStatus(proposal.verificationStatus)}
                semanticType={getVerificationStatusSemantic(proposal.verificationStatus)}
              />
            </td>
            <td className="p-4">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {proposal.submittedAt}
              </p>
            </td>
            <td className="p-4">
              {!proposal.assignedTo && onPickProposal && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => onPickProposal(proposal.datasetUniqueId, e)}
                  className="flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Pick
                </Button>
              )}
              {proposal.assignedTo && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Assigned
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
