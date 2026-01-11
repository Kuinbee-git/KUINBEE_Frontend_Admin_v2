"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, Building2, User, Mail, Phone, Globe, Calendar, CheckCircle2, XCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, formatStatusLabel, getKYCStatusSemantic } from "@/components/shared/StatusBadge";
import { useSupplier, useSupplierKyc } from "@/hooks";

interface SupplierDetailViewProps {
  supplierId: string;
}

export function SupplierDetailView({ supplierId }: SupplierDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: supplier, isLoading } = useSupplier(supplierId);
  const { data: kycData, isLoading: isLoadingKyc } = useSupplierKyc(supplierId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-surface)" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading supplier details...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-surface)" }}>
        <p style={{ color: "var(--text-muted)" }}>Supplier not found</p>
      </div>
    );
  }

  const handleViewAnalytics = () => {
    router.push(`/dashboard/suppliers/${supplierId}/analytics`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-surface)" }}>
      {/* Header */}
      <div
        className="p-6 border-b"
        style={{
          backgroundColor: "var(--bg-base)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleViewAnalytics} className="gap-2">
            <BarChart3 className="w-4 h-4" />
            View Analytics & Reports
          </Button>
        </div>

        {/* Supplier Header Info */}
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "2px solid var(--border-default)",
            }}
          >
            {supplier.supplierProfile.supplierType === "COMPANY" ? (
              <Building2 className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
            ) : (
              <User className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {supplier.supplierProfile.supplierType === "COMPANY"
                  ? supplier.supplierProfile.companyName
                  : supplier.supplierProfile.individualName}
              </h1>
              <StatusBadge
                status={formatStatusLabel(supplier.supplier.status)}
                semanticType={
                  supplier.supplier.status === "ACTIVE"
                    ? "success"
                    : supplier.supplier.status === "SUSPENDED"
                    ? "error"
                    : "warning"
                }
              />
            </div>
            <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              {supplier.supplierProfile.supplierType} Supplier
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Member since {new Date(supplier.supplier.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="kyc">KYC Details</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Contact Information */}
            <Card style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Primary contact details for this supplier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      Email
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      <span style={{ color: "var(--text-primary)" }}>{supplier.supplier.email}</span>
                      {supplier.supplier.emailVerified ? (
                        <CheckCircle2 className="w-4 h-4" style={{ color: "var(--status-success)" }} />
                      ) : (
                        <XCircle className="w-4 h-4" style={{ color: "var(--status-error)" }} />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      Phone
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      <span style={{ color: "var(--text-primary)" }}>
                        {supplier.supplier.phone || "Not provided"}
                      </span>
                    </div>
                  </div>
                </div>

                {supplier.supplierProfile.supplierType === "COMPANY" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                          Contact Person
                        </label>
                        <p className="mt-1" style={{ color: "var(--text-primary)" }}>
                          {supplier.supplierProfile.contactPersonName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                          Designation
                        </label>
                        <p className="mt-1" style={{ color: "var(--text-primary)" }}>
                          {supplier.supplierProfile.designation || "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        Contact Email
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                        <span style={{ color: "var(--text-primary)" }}>
                          {supplier.supplierProfile.contactEmail}
                        </span>
                        {supplier.supplierProfile.contactEmailVerified ? (
                          <CheckCircle2 className="w-4 h-4" style={{ color: "var(--status-success)" }} />
                        ) : (
                          <XCircle className="w-4 h-4" style={{ color: "var(--status-error)" }} />
                        )}
                      </div>
                    </div>
                  </>
                )}

                {supplier.supplierProfile.websiteUrl && (
                  <div>
                    <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      Website
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Globe className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      <a
                        href={supplier.supplierProfile.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {supplier.supplierProfile.websiteUrl}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Business domains and data offerings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                    Business Domains
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {supplier.supplierProfile.businessDomains.map((domain) => (
                      <span
                        key={domain}
                        className="px-3 py-1 text-sm rounded-full"
                        style={{
                          backgroundColor: "var(--bg-surface)",
                          border: "1px solid var(--border-default)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>

                {supplier.supplierProfile.primaryDomain && (
                  <div>
                    <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      Primary Domain
                    </label>
                    <p className="mt-1" style={{ color: "var(--text-primary)" }}>
                      {supplier.supplierProfile.primaryDomain}
                    </p>
                  </div>
                )}

                {supplier.supplierProfile.naturesOfDataProvided && (
                  <div>
                    <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      Nature of Data Provided
                    </label>
                    <p className="mt-1" style={{ color: "var(--text-primary)" }}>
                      {supplier.supplierProfile.naturesOfDataProvided}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Activity */}
            <Card style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
              <CardHeader>
                <CardTitle>Account Activity</CardTitle>
                <CardDescription>Account status and history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      Created At
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      <span style={{ color: "var(--text-primary)" }}>
                        {new Date(supplier.supplier.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      Last Updated
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      <span style={{ color: "var(--text-primary)" }}>
                        {new Date(supplier.supplier.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {supplier.supplier.lastLoginAt && (
                  <div>
                    <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      Last Login
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      <span style={{ color: "var(--text-primary)" }}>
                        {new Date(supplier.supplier.lastLoginAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc" className="mt-6">
            {isLoadingKyc ? (
              <Card style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
                <CardContent className="py-8">
                  <div className="text-center">
                    <p style={{ color: "var(--text-muted)" }}>Loading KYC details...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" style={{ color: "var(--brand-primary)" }} />
                    KYC Verification Details
                  </CardTitle>
                  <CardDescription>Complete Know Your Customer verification information</CardDescription>
                </CardHeader>
                <CardContent>
                  {kycData?.kyc ? (
                    <div className="space-y-6">
                      {/* KYC Overview */}
                      <div className="grid grid-cols-2 gap-4 p-4 rounded-lg" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
                        <div>
                          <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                            Status
                          </label>
                          <div className="mt-1">
                            <StatusBadge
                              status={formatStatusLabel(kycData.kyc.status)}
                              semanticType={getKYCStatusSemantic(kycData.kyc.status)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                            Provider
                          </label>
                          <p className="mt-1 font-medium" style={{ color: "var(--text-primary)" }}>
                            {kycData.kyc.provider}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                            Created At
                          </label>
                          <p className="mt-1" style={{ color: "var(--text-primary)" }}>
                            {new Date(kycData.kyc.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                            Last Updated
                          </label>
                          <p className="mt-1" style={{ color: "var(--text-primary)" }}>
                            {new Date(kycData.kyc.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {kycData.kyc.failureReason && (
                        <div className="p-4 rounded-lg" style={{ backgroundColor: "var(--status-error-bg)", border: "1px solid var(--status-error)" }}>
                          <label className="text-sm font-medium" style={{ color: "var(--status-error)" }}>
                            Failure Reason
                          </label>
                          <p className="mt-1" style={{ color: "var(--status-error)" }}>
                            {kycData.kyc.failureReason}
                          </p>
                        </div>
                      )}

                      {/* KYC Checks */}
                      {kycData.kyc.checks && kycData.kyc.checks.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                            Verification Checks
                          </h3>
                          <div className="space-y-3">
                            {kycData.kyc.checks.map((check) => (
                              <div
                                key={check.id}
                                className="p-4 rounded-lg"
                                style={{
                                  backgroundColor: "var(--bg-surface)",
                                  border: "1px solid var(--border-default)",
                                }}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium" style={{ color: "var(--text-primary)" }}>
                                        {check.checkType.replace(/_/g, " ")}
                                      </h4>
                                      <StatusBadge
                                        status={formatStatusLabel(check.status)}
                                        semanticType={getKYCStatusSemantic(check.status)}
                                      />
                                    </div>
                                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                      Value: {check.valueMasked}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  {check.providerRequestId && (
                                    <div>
                                      <label className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        Request ID
                                      </label>
                                      <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                                        {check.providerRequestId}
                                      </p>
                                    </div>
                                  )}
                                  {check.providerReferenceId && (
                                    <div>
                                      <label className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        Reference ID
                                      </label>
                                      <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                                        {check.providerReferenceId}
                                      </p>
                                    </div>
                                  )}
                                  {check.submittedAt && (
                                    <div>
                                      <label className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        Submitted At
                                      </label>
                                      <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                                        {new Date(check.submittedAt).toLocaleString()}
                                      </p>
                                    </div>
                                  )}
                                  {check.verifiedAt && (
                                    <div>
                                      <label className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        Verified At
                                      </label>
                                      <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                                        {new Date(check.verifiedAt).toLocaleString()}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                      <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                        KYC Not Started
                      </p>
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        This supplier has not initiated the KYC verification process yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
