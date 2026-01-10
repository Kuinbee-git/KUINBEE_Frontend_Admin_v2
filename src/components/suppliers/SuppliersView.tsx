"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupplierFilters } from "@/components/suppliers/SupplierFilters";
import { SupplierTable } from "@/components/suppliers/SupplierTable";
import { SupplierInvitesView } from "@/components/suppliers/SupplierInvitesView";

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

interface Supplier {
  id: string;
  name: string;
  type: "individual" | "company";
  businessDomains: string[];
  kycStatus: Exclude<KYCStatus, "all">;
  email: string;
  emailVerified: boolean;
  datasetCount: number;
  createdDate: string;
}

export function SuppliersView() {
  const router = useRouter();

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<SupplierType>("all");
  const [datasetPresenceFilter, setDatasetPresenceFilter] =
    useState<DatasetPresence>("all");
  const [kycStatusFilter, setKycStatusFilter] = useState<KYCStatus>("all");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [emailVerifiedFilter, setEmailVerifiedFilter] =
    useState<string>("all");

  // Mock data
  const allSuppliers: Supplier[] = [
    {
      id: "SUP-2024-001",
      name: "DataCorp International",
      type: "company",
      businessDomains: ["Supply Chain", "Logistics", "Manufacturing"],
      kycStatus: "approved",
      email: "contact@datacorp.com",
      emailVerified: true,
      datasetCount: 12,
      createdDate: "2024-01-15T10:00:00Z",
    },
    {
      id: "SUP-2024-002",
      name: "Insight Data Partners",
      type: "company",
      businessDomains: ["Consumer Analytics", "Market Research"],
      kycStatus: "approved",
      email: "info@insightdata.com",
      emailVerified: true,
      datasetCount: 8,
      createdDate: "2024-02-20T14:30:00Z",
    },
    {
      id: "SUP-2024-003",
      name: "John Anderson",
      type: "individual",
      businessDomains: ["Finance", "Investment"],
      kycStatus: "in_progress",
      email: "j.anderson@email.com",
      emailVerified: true,
      datasetCount: 3,
      createdDate: "2024-03-10T09:15:00Z",
    },
    {
      id: "SUP-2024-004",
      name: "Global Analytics Ltd",
      type: "company",
      businessDomains: ["Healthcare", "Pharmaceuticals"],
      kycStatus: "submitted",
      email: "contact@globalanalytics.com",
      emailVerified: false,
      datasetCount: 5,
      createdDate: "2024-04-05T11:45:00Z",
    },
    {
      id: "SUP-2024-005",
      name: "Maria Rodriguez",
      type: "individual",
      businessDomains: ["E-commerce", "Retail"],
      kycStatus: "not_started",
      email: "maria.r@email.com",
      emailVerified: true,
      datasetCount: 0,
      createdDate: "2024-05-12T16:20:00Z",
    },
    {
      id: "SUP-2024-006",
      name: "TechData Solutions",
      type: "company",
      businessDomains: ["Technology", "Software", "Cloud Services"],
      kycStatus: "approved",
      email: "info@techdata.com",
      emailVerified: true,
      datasetCount: 15,
      createdDate: "2024-01-08T08:00:00Z",
    },
    {
      id: "SUP-2024-007",
      name: "Sarah Mitchell",
      type: "individual",
      businessDomains: ["Education", "EdTech"],
      kycStatus: "rejected",
      email: "s.mitchell@email.com",
      emailVerified: false,
      datasetCount: 2,
      createdDate: "2024-06-18T13:30:00Z",
    },
    {
      id: "SUP-2024-008",
      name: "Urban Insights Group",
      type: "company",
      businessDomains: ["Real Estate", "Urban Planning"],
      kycStatus: "expired",
      email: "contact@urbaninsights.com",
      emailVerified: true,
      datasetCount: 6,
      createdDate: "2023-11-20T10:00:00Z",
    },
  ];

  // Available business domains for filter
  const domainList = [
    "Supply Chain",
    "Logistics",
    "Manufacturing",
    "Consumer Analytics",
    "Market Research",
    "Finance",
    "Investment",
    "Healthcare",
    "Pharmaceuticals",
    "E-commerce",
    "Retail",
    "Technology",
    "Software",
    "Cloud Services",
    "Education",
    "EdTech",
    "Real Estate",
    "Urban Planning",
  ];

  // Filter logic
  const filteredSuppliers = allSuppliers.filter((supplier) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = supplier.name.toLowerCase().includes(query);
      const matchesId = supplier.id.toLowerCase().includes(query);
      const matchesEmail = supplier.email.toLowerCase().includes(query);
      const matchesDomain = supplier.businessDomains.some(domain => domain.toLowerCase().includes(query));
      if (!matchesName && !matchesId && !matchesEmail && !matchesDomain) return false;
    }

    // Type filter
    if (typeFilter !== "all" && supplier.type !== typeFilter) {
      return false;
    }

    // Dataset presence filter
    if (datasetPresenceFilter === "has_datasets" && supplier.datasetCount === 0) {
      return false;
    }
    if (datasetPresenceFilter === "no_datasets" && supplier.datasetCount > 0) {
      return false;
    }

    // KYC status filter
    if (kycStatusFilter !== "all" && supplier.kycStatus !== kycStatusFilter) {
      return false;
    }

    // Email verified filter
    if (emailVerifiedFilter === "verified" && !supplier.emailVerified) {
      return false;
    }
    if (emailVerifiedFilter === "unverified" && supplier.emailVerified) {
      return false;
    }

    // Business domains filter
    if (selectedDomains.length > 0) {
      const hasMatchingDomain = selectedDomains.some((domain) =>
        supplier.businessDomains.includes(domain)
      );
      if (!hasMatchingDomain) {
        return false;
      }
    }

    return true;
  });

  const clearAllFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setDatasetPresenceFilter("all");
    setKycStatusFilter("all");
    setSelectedDomains([]);
    setEmailVerifiedFilter("all");
  };

  const handleRowClick = (supplierId: string) => {
    router.push(`/dashboard/suppliers/${supplierId}`);
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg-surface)" }}
    >
      {/* Header */}
      <div
        className="p-6 border-b"
        style={{
          backgroundColor: "var(--bg-base)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Suppliers
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Manage suppliers and supplier invitations
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/suppliers/new")}
            style={{
              backgroundColor: "var(--brand-primary)",
              color: "#ffffff",
            }}
          >
            Create Supplier
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="suppliers" className="w-full">
        <div className="px-6 pt-6">
          <TabsList>
            <TabsTrigger value="suppliers">All Suppliers</TabsTrigger>
            <TabsTrigger value="invites">Invites</TabsTrigger>
          </TabsList>
        </div>

        {/* All Suppliers Tab */}
        <TabsContent value="suppliers" className="mt-0">
          {/* Filters */}
          <SupplierFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            datasetPresenceFilter={datasetPresenceFilter}
            setDatasetPresenceFilter={setDatasetPresenceFilter}
            kycStatusFilter={kycStatusFilter}
            setKycStatusFilter={setKycStatusFilter}
            selectedDomains={selectedDomains}
            setSelectedDomains={setSelectedDomains}
            emailVerifiedFilter={emailVerifiedFilter}
            setEmailVerifiedFilter={setEmailVerifiedFilter}
            domainList={domainList}
            clearAllFilters={clearAllFilters}
          />

          {/* Table */}
          <div className="p-6">
            <div
              className="rounded-lg border overflow-hidden"
              style={{
                backgroundColor: "var(--bg-base)",
                borderColor: "var(--border-default)",
              }}
            >
              {filteredSuppliers.length > 0 ? (
                <SupplierTable
                  suppliers={filteredSuppliers}
                  onRowClick={handleRowClick}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <p
                    className="text-sm font-medium mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    No suppliers found
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Try adjusting your filters to see more results
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Invites Tab */}
        <TabsContent value="invites" className="mt-0">
          <div className="p-6">
            <SupplierInvitesView />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
