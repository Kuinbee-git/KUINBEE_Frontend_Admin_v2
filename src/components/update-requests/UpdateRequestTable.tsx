'use client';

import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  StatusBadge,
  getDatasetStatusSemantic,
  getVerificationStatusSemantic,
} from '@/components/shared/StatusBadge';
import type { DatasetStatus, VerificationStatus } from '@/types/dataset.types';

interface UpdateRequestListItem {
  id: string;
  datasetUniqueId: string;
  title: string;
  supplierName: string;
  supplierEmail: string | null;
  category: string;
  status: DatasetStatus;
  verificationStatus: VerificationStatus;
  assignedTo: string | null;
  submittedAt: string;
}

interface UpdateRequestTableProps {
  proposals: UpdateRequestListItem[];
  onRowClick: (datasetId: string) => void;
  onPickProposal?: (datasetId: string, e: React.MouseEvent) => void;
  pickingDatasetId?: string;
}

export function UpdateRequestTable({
  proposals,
  onRowClick,
  onPickProposal,
  pickingDatasetId,
}: UpdateRequestTableProps) {
  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div
      className="w-full overflow-x-auto"
      role="region"
      aria-label="Dataset update requests"
      tabIndex={0}
    >
      <table className="w-full min-w-[980px]">
        <thead>
          <tr
            className="border-b text-left text-xs"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--text-muted)',
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
              className="cursor-pointer border-b transition-colors hover:bg-[var(--bg-surface)] focus-visible:bg-[var(--bg-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]"
              style={{ borderColor: 'var(--border-default)' }}
              onClick={() => onRowClick(proposal.id)}
              onKeyDown={(event) => {
                if (
                  event.target !== event.currentTarget ||
                  (event.key !== 'Enter' && event.key !== ' ')
                ) {
                  return;
                }
                event.preventDefault();
                onRowClick(proposal.id);
              }}
              tabIndex={0}
              aria-label={`Open dataset update request ${proposal.title}`}
            >
              <td className="p-4">
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {proposal.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {proposal.datasetUniqueId}
                  </p>
                </div>
              </td>
              <td className="p-4">
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {proposal.supplierName}
                </p>
                {proposal.supplierEmail ? (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {proposal.supplierEmail}
                  </p>
                ) : null}
              </td>
              <td className="p-4">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
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
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {proposal.submittedAt}
                </p>
              </td>
              <td className="p-4">
                {!proposal.assignedTo &&
                  ['SUBMITTED', 'RESUBMITTED'].includes(proposal.verificationStatus) &&
                  onPickProposal && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => onPickProposal(proposal.id, event)}
                      disabled={Boolean(pickingDatasetId)}
                      className="flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                      {pickingDatasetId === proposal.id ? 'Assigning…' : 'Pick'}
                    </Button>
                  )}
                {proposal.assignedTo && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Assigned
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
