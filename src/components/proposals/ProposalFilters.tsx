"use client";

import { FilterBar, FilterConfig, ActiveFilter } from "@/components/shared/FilterBar";
import { formatStatusLabel } from "@/components/shared/StatusBadge";
import type { DatasetStatus, VerificationStatus } from "@/types/dataset.types";

type AssignmentFilter = "all" | "ME" | "UNASSIGNED" | "ANY";

interface ProposalFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: DatasetStatus | "all";
  setStatusFilter: (value: DatasetStatus | "all") => void;
  verificationFilter: VerificationStatus | "all";
  setVerificationFilter: (value: VerificationStatus | "all") => void;
  assignmentFilter: AssignmentFilter;
  setAssignmentFilter: (value: AssignmentFilter) => void;
  clearAllFilters: () => void;
}

export function ProposalFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  verificationFilter,
  setVerificationFilter,
  assignmentFilter,
  setAssignmentFilter,
  clearAllFilters,
}: ProposalFiltersProps) {
  // Build filter configurations
  const filters: FilterConfig<unknown>[] = [
    {
      id: "search",
      type: "search",
      label: "Search",
      placeholder: "Search by title or supplier...",
      value: searchQuery,
      onChange: (value) => setSearchQuery(value as string),
      showInPrimary: true,
    },
    {
      id: "status",
      type: "select",
      label: "Status",
      placeholder: "All Statuses",
      value: statusFilter,
      onChange: (value) => setStatusFilter(value as DatasetStatus | "all"),
      options: [
        { value: "all", label: "All Statuses" },
        { value: "SUBMITTED", label: "Submitted" },
        { value: "UNDER_REVIEW", label: "Under Review" },
        { value: "VERIFIED", label: "Verified" },
        { value: "REJECTED", label: "Rejected" },
      ],
      showInPrimary: true,
    },
    {
      id: "verification",
      type: "select",
      label: "Verification",
      placeholder: "All Verification",
      value: verificationFilter,
      onChange: (value) => setVerificationFilter(value as VerificationStatus | "all"),
      options: [
        { value: "all", label: "All Verification" },
        { value: "PENDING", label: "Pending" },
        { value: "SUBMITTED", label: "Submitted" },
        { value: "CHANGES_REQUESTED", label: "Changes Requested" },
        { value: "RESUBMITTED", label: "Resubmitted" },
        { value: "UNDER_REVIEW", label: "Under Review" },
        { value: "VERIFIED", label: "Verified" },
        { value: "REJECTED", label: "Rejected" },
      ],
      showInPrimary: true,
    },
    {
      id: "assignment",
      type: "select",
      label: "Assignment",
      placeholder: "All Assignments",
      value: assignmentFilter,
      onChange: (value) => setAssignmentFilter(value as AssignmentFilter),
      options: [
        { value: "all", label: "All Assignments" },
        { value: "ME", label: "Assigned to Me" },
        { value: "UNASSIGNED", label: "Unassigned" },
        { value: "ANY", label: "Any Assignment" },
      ],
      showInPrimary: true,
    },
  ];

  // Build active filters for chips
  const activeFilters: ActiveFilter[] = [];

  if (searchQuery) {
    activeFilters.push({
      key: "search",
      label: `Search: "${searchQuery}"`,
      onRemove: () => setSearchQuery(""),
    });
  }

  if (statusFilter !== "all") {
    activeFilters.push({
      key: "status",
      label: `Status: ${formatStatusLabel(statusFilter)}`,
      onRemove: () => setStatusFilter("all"),
    });
  }

  if (verificationFilter !== "all") {
    activeFilters.push({
      key: "verification",
      label: `Verification: ${formatStatusLabel(verificationFilter)}`,
      onRemove: () => setVerificationFilter("all"),
    });
  }

  if (assignmentFilter !== "all") {
    const assignmentLabels: Record<string, string> = {
      ME: "Assigned to Me",
      UNASSIGNED: "Unassigned",
      ANY: "Any Assignment",
    };
    activeFilters.push({
      key: "assignment",
      label: `Assignment: ${assignmentLabels[assignmentFilter]}`,
      onRemove: () => setAssignmentFilter("all"),
    });
  }

  return (
    <FilterBar
      filters={filters}
      activeFilters={activeFilters}
      onClearAll={activeFilters.length > 0 ? clearAllFilters : undefined}
    />
  );
}
