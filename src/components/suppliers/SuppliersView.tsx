"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupplierFilters } from "@/components/suppliers/SupplierFilters";
import { SupplierTable } from "@/components/suppliers/SupplierTable";
import { SupplierInvitesView } from "@/components/suppliers/SupplierInvitesView";
import { useSuppliers } from "@/hooks";
import type { SupplierListParams } from "@/services/suppliers.service";
import type { SupplierListItem } from "@/types";

export function SuppliersView() {
  const router = useRouter();

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INDIVIDUAL" | "COMPANY">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "DELETED">("ALL");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState<string>("all");

  // API params
  const apiParams: SupplierListParams = {
    page: 1,
    pageSize: 20,
    q: searchQuery || undefined,
    supplierType: typeFilter === "ALL" ? undefined : typeFilter,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    sort: "createdAt:desc",
  };

  // Fetch suppliers
  const { data, isLoading } = useSuppliers(apiParams);
  const suppliers = data?.items || [];

  // Available business domains for filter (can be fetched from API later)
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

  // Filter suppliers client-side for domain and email verification
  const filteredSuppliers = suppliers.filter((supplierItem: SupplierListItem) => {
    // Email verified filter
    if (emailVerifiedFilter === "verified" && !supplierItem.supplierProfile.contactEmailVerified) {
      return false;
    }
    if (emailVerifiedFilter === "unverified" && supplierItem.supplierProfile.contactEmailVerified) {
      return false;
    }

    // Business domains filter
    if (selectedDomains.length > 0) {
      const hasMatchingDomain = selectedDomains.some((domain) =>
        supplierItem.supplierProfile.businessDomains.includes(domain)
      );
      if (!hasMatchingDomain) {
        return false;
      }
    }

    return true;
  });

  const clearAllFilters = () => {
    setSearchQuery("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
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
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
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
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <p
                    className="text-sm font-medium mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Loading suppliers...
                  </p>
                </div>
              ) : filteredSuppliers.length > 0 ? (
                <SupplierTable
                  suppliers={filteredSuppliers}
                  onRowClick={(supplierId: string) => handleRowClick(supplierId)}
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
