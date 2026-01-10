"use client";

import { FilterBar, FilterConfig, ActiveFilter } from "@/components/shared/FilterBar";
import { formatStatusLabel } from "@/components/shared/StatusBadge";

type SupplierType = "all" | "individual" | "company";
type DatasetPresence = "all" | "has_datasets" | "no_datasets";
type KYCStatus =
  | "all"
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected"
  | "expired";

interface SupplierFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  typeFilter: SupplierType;
  setTypeFilter: (value: SupplierType) => void;
  datasetPresenceFilter: DatasetPresence;
  setDatasetPresenceFilter: (value: DatasetPresence) => void;
  kycStatusFilter: KYCStatus;
  setKycStatusFilter: (value: KYCStatus) => void;
  selectedDomains: string[];
  setSelectedDomains: (value: string[]) => void;
  emailVerifiedFilter: string;
  setEmailVerifiedFilter: (value: string) => void;
  domainList: string[];
  clearAllFilters: () => void;
}

export function SupplierFilters({
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  datasetPresenceFilter,
  setDatasetPresenceFilter,
  kycStatusFilter,
  setKycStatusFilter,
  selectedDomains,
  setSelectedDomains,
  emailVerifiedFilter,
  setEmailVerifiedFilter,
  domainList,
  clearAllFilters,
}: SupplierFiltersProps) {
  const filters: FilterConfig<unknown>[] = [
    {
      id: "search",
      type: "search",
      label: "Search",
      placeholder: "Search by name, ID, email, or domain...",
      value: searchQuery,
      onChange: (value) => setSearchQuery(value as string),
      showInPrimary: true,
    },
    {
      id: "type",
      type: "toggle",
      label: "Type",
      value: typeFilter,
      onChange: (value) => setTypeFilter(value as SupplierType),
      options: [
        { value: "all", label: "All" },
        { value: "individual", label: "Individual" },
        { value: "company", label: "Company" },
      ],
    },
    {
      id: "datasets",
      type: "toggle",
      label: "Datasets",
      value: datasetPresenceFilter,
      onChange: (value) => setDatasetPresenceFilter(value as DatasetPresence),
      options: [
        { value: "all", label: "All" },
        { value: "has_datasets", label: "Has Datasets" },
        { value: "no_datasets", label: "No Datasets" },
      ],
    },
    {
      id: "kycStatus",
      type: "select",
      label: "KYC Status",
      value: kycStatusFilter,
      onChange: (value) => setKycStatusFilter(value as KYCStatus),
      width: "w-[180px]",
      options: [
        { value: "all", label: "All Statuses" },
        { value: "not_started", label: "Not Started" },
        { value: "in_progress", label: "In Progress" },
        { value: "submitted", label: "Submitted" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "expired", label: "Expired" },
      ],
    },
    {
      id: "email",
      type: "select",
      label: "Email",
      value: emailVerifiedFilter,
      onChange: (value) => setEmailVerifiedFilter(value as string),
      width: "w-[140px]",
      options: [
        { value: "all", label: "All" },
        { value: "verified", label: "Verified" },
        { value: "unverified", label: "Unverified" },
      ],
    },
    {
      id: "domains",
      type: "popover",
      label: "Business Domains",
      value: selectedDomains,
      onChange: (value) => setSelectedDomains(value as string[]),
      options: domainList.map((domain) => ({ value: domain, label: domain })),
    },
  ];

  const activeFilters: ActiveFilter[] = [];

  if (typeFilter !== "all") {
    activeFilters.push({
      key: "type",
      label: `Type: ${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}`,
      onRemove: () => setTypeFilter("all"),
    });
  }

  if (datasetPresenceFilter !== "all") {
    activeFilters.push({
      key: "datasetPresence",
      label: datasetPresenceFilter === "has_datasets" ? "Has Datasets" : "No Datasets",
      onRemove: () => setDatasetPresenceFilter("all"),
    });
  }

  if (kycStatusFilter !== "all") {
    activeFilters.push({
      key: "kycStatus",
      label: `KYC: ${formatStatusLabel(kycStatusFilter)}`,
      onRemove: () => setKycStatusFilter("all"),
    });
  }

  if (emailVerifiedFilter !== "all") {
    activeFilters.push({
      key: "emailVerified",
      label: `Email: ${emailVerifiedFilter === "verified" ? "Verified" : "Unverified"}`,
      onRemove: () => setEmailVerifiedFilter("all"),
    });
  }

  selectedDomains.forEach((domain) => {
    activeFilters.push({
      key: `domain-${domain}`,
      label: `Domain: ${domain}`,
      onRemove: () => setSelectedDomains(selectedDomains.filter((d) => d !== domain)),
    });
  });

  return (
    <FilterBar
      filters={filters}
      activeFilters={activeFilters}
      onClearAll={clearAllFilters}
    />
  );
}
