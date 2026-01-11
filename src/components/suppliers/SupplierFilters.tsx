"use client";

import { FilterBar, FilterConfig, ActiveFilter } from "@/components/shared/FilterBar";

type SupplierType = "ALL" | "INDIVIDUAL" | "COMPANY";
type SupplierStatus = "ALL" | "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "DELETED";

interface SupplierFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  typeFilter: SupplierType;
  setTypeFilter: (value: SupplierType) => void;
  statusFilter: SupplierStatus;
  setStatusFilter: (value: SupplierStatus) => void;
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
  statusFilter,
  setStatusFilter,
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
      label: "Search",
      type: "search",
      value: searchQuery,
      onChange: (value) => setSearchQuery(value as string),
      placeholder: "Search by name, ID, email, or domain...",
    },
    {
      id: "type",
      label: "Supplier Type",
      type: "select",
      value: typeFilter,
      onChange: (value) => setTypeFilter(value as SupplierType),
      options: [
        { value: "ALL", label: "All Types" },
        { value: "INDIVIDUAL", label: "Individual" },
        { value: "COMPANY", label: "Company" },
      ],
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      value: statusFilter,
      onChange: (value) => setStatusFilter(value as SupplierStatus),
      options: [
        { value: "ALL", label: "All Statuses" },
        { value: "ACTIVE", label: "Active" },
        { value: "INACTIVE", label: "Inactive" },
        { value: "SUSPENDED", label: "Suspended" },
        { value: "PENDING_VERIFICATION", label: "Pending Verification" },
        { value: "DELETED", label: "Deleted" },
      ],
    },
    {
      id: "email-verified",
      label: "Email Verified",
      type: "select",
      value: emailVerifiedFilter,
      onChange: (value) => setEmailVerifiedFilter(value as string),
      options: [
        { value: "all", label: "All" },
        { value: "verified", label: "Verified" },
        { value: "unverified", label: "Unverified" },
      ],
    },
    {
      id: "domains",
      label: "Business Domains",
      type: "popover",
      value: selectedDomains,
      onChange: (value) => setSelectedDomains(value as string[]),
      options: domainList.map(domain => ({
        value: domain,
        label: domain,
      })),
    },
  ];

  const activeFilters: ActiveFilter[] = [];

  if (typeFilter !== "ALL") {
    activeFilters.push({
      key: "type",
      label: `Type: ${typeFilter}`,
      onRemove: () => setTypeFilter("ALL"),
    });
  }

  if (statusFilter !== "ALL") {
    activeFilters.push({
      key: "status",
      label: `Status: ${statusFilter.replace(/_/g, " ")}`,
      onRemove: () => setStatusFilter("ALL"),
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
