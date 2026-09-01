'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  CheckCircle2,
  XCircle,
  Shield,
  FileCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  formatEnumLabel,
  StatusBadge,
  formatStatusLabel,
  getKYCStatusSemantic,
} from '@/components/shared/StatusBadge';
import { useSupplier, useSupplierKyc } from '@/hooks';
import { markOfflineContractDone } from '@/services/suppliers.service';
import { toast } from 'sonner';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';
import { getSafeHttpUrl } from '@/lib/utils/url.utils';

interface SupplierDetailViewProps {
  supplierId: string;
}

export function SupplierDetailView({ supplierId }: SupplierDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMarkingContractDone, setIsMarkingContractDone] = useState(false);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);

  const {
    data: supplier,
    isLoading,
    isError,
    error,
    refetch: refetchSupplier,
  } = useSupplier(supplierId);
  const {
    data: kycData,
    isLoading: isLoadingKyc,
    isError: isKycError,
    error: kycError,
    refetch: refetchKyc,
  } = useSupplierKyc(supplierId);
  const { can } = useAuthorization();
  const canViewAnalytics = can({
    allOf: [PERMISSIONS.SUPPLIERS.VIEW, PERMISSIONS.SUPPLIERS.VIEW_ANALYTICS],
  });
  const canManageVerification = can({
    anyOf: [PERMISSIONS.SUPPLIERS.MANAGE_VERIFICATION],
  });

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <p style={{ color: 'var(--text-muted)' }}>Loading supplier details...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[var(--bg-surface)] p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="py-10 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-[var(--state-error)]" aria-hidden="true" />
            <h1 className="mt-3 text-xl">Could not load supplier</h1>
            <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
              {getFriendlyErrorMessage(error)}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Back
              </Button>
              <Button onClick={() => refetchSupplier()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <p style={{ color: 'var(--text-muted)' }}>Supplier not found</p>
      </div>
    );
  }

  const handleViewAnalytics = () => {
    router.push(`/dashboard/suppliers/${supplierId}/analytics`);
  };

  const handleMarkOfflineContractDone = async () => {
    if (!canManageVerification) return;
    try {
      setIsMarkingContractDone(true);
      await markOfflineContractDone(supplierId);

      toast.success('Offline contract has been marked as completed.', {
        description: 'The supplier can now publish datasets.',
      });

      // Refetch supplier data to show updated offline contract status
      await refetchSupplier();
      setContractDialogOpen(false);
    } catch (error) {
      toast.error('Error', {
        description: getFriendlyErrorMessage(error),
      });
    } finally {
      setIsMarkingContractDone(false);
    }
  };

  const supplierWebsiteUrl = getSafeHttpUrl(supplier.supplierProfile.websiteUrl);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      {/* Header */}
      <div
        className="border-b p-4 sm:p-6"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          {canViewAnalytics ? (
            <Button onClick={handleViewAnalytics} className="gap-2">
              <BarChart3 className="w-4 h-4" />
              View Analytics & Reports
            </Button>
          ) : null}
        </div>

        {/* Supplier Header Info */}
        <div className="flex flex-col items-start gap-4 sm:flex-row">
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '2px solid var(--border-default)',
            }}
          >
            {supplier.supplierProfile.supplierType === 'COMPANY' ? (
              <Building2 className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            ) : (
              <User className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            )}
          </div>
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {supplier.supplierProfile.supplierType === 'COMPANY'
                  ? supplier.supplierProfile.companyName
                  : supplier.supplierProfile.individualName}
              </h1>
              <StatusBadge
                status={formatStatusLabel(supplier.supplier.status)}
                semanticType={
                  supplier.supplier.status === 'ACTIVE'
                    ? 'success'
                    : supplier.supplier.status === 'SUSPENDED'
                      ? 'error'
                      : 'warning'
                }
              />
            </div>
            <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
              {formatEnumLabel(supplier.supplierProfile.supplierType)} supplier
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Member since{' '}
              {new Date(supplier.supplier.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="kyc">KYC Details</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Contact Information */}
            <Card
              style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
            >
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Primary contact details for this supplier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      Email
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-primary)' }}>
                        {supplier.supplier.email}
                      </span>
                      {supplier.supplier.emailVerified ? (
                        <CheckCircle2
                          className="w-4 h-4"
                          style={{ color: 'var(--status-success)' }}
                        />
                      ) : (
                        <XCircle className="w-4 h-4" style={{ color: 'var(--status-error)' }} />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      Phone
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-primary)' }}>
                        {supplier.supplier.phone || 'Not provided'}
                      </span>
                    </div>
                  </div>
                </div>

                {supplier.supplierProfile.supplierType === 'COMPANY' && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                          Contact Person
                        </p>
                        <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                          {supplier.supplierProfile.contactPersonName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                          Designation
                        </p>
                        <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                          {supplier.supplierProfile.designation || 'Not provided'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                        Contact Email
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-primary)' }}>
                          {supplier.supplierProfile.contactEmail}
                        </span>
                        {supplier.supplierProfile.contactEmailVerified ? (
                          <CheckCircle2
                            className="w-4 h-4"
                            style={{ color: 'var(--status-success)' }}
                          />
                        ) : (
                          <XCircle className="w-4 h-4" style={{ color: 'var(--status-error)' }} />
                        )}
                      </div>
                    </div>
                  </>
                )}

                {supplier.supplierProfile.websiteUrl && (
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      Website
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Globe className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      {supplierWebsiteUrl ? (
                        <a
                          href={supplierWebsiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--status-info)] hover:underline"
                        >
                          {supplier.supplierProfile.websiteUrl}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {supplier.supplierProfile.websiteUrl}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card
              style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
            >
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Business domains and data offerings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Business Domains
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {supplier.supplierProfile.businessDomains.map((domain) => (
                      <span
                        key={domain}
                        className="px-3 py-1 text-sm rounded-full"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>

                {supplier.supplierProfile.primaryDomain && (
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      Primary Domain
                    </p>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {supplier.supplierProfile.primaryDomain}
                    </p>
                  </div>
                )}

                {supplier.supplierProfile.naturesOfDataProvided && (
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      Nature of Data Provided
                    </p>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {supplier.supplierProfile.naturesOfDataProvided}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Offline Contract Status - CRITICAL ACTION */}
            <Card
              style={{
                backgroundColor: 'var(--bg-base)',
                boxShadow: supplier.supplierProfile.isOfflineContractDone
                  ? 'var(--shadow-card)'
                  : 'var(--shadow-card), inset 0 0 0 1px var(--status-warning-border)',
              }}
            >
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: supplier.supplierProfile.isOfflineContractDone
                          ? 'var(--status-success-bg)'
                          : 'var(--status-warning-bg)',
                      }}
                    >
                      <FileCheck
                        className="w-5 h-5"
                        style={{
                          color: supplier.supplierProfile.isOfflineContractDone
                            ? 'var(--status-success)'
                            : 'var(--status-warning)',
                        }}
                      />
                    </div>
                    <div>
                      <CardTitle>Offline Contract Verification</CardTitle>
                      <CardDescription className="mt-1">
                        {supplier.supplierProfile.isOfflineContractDone
                          ? 'Contract has been verified and completed'
                          : 'Required: Mark offline contract as completed to enable publishing'}
                      </CardDescription>
                    </div>
                  </div>
                  <StatusBadge
                    status={
                      supplier.supplierProfile.isOfflineContractDone ? 'Completed' : 'Pending'
                    }
                    semanticType={
                      supplier.supplierProfile.isOfflineContractDone ? 'success' : 'warning'
                    }
                  />
                </div>
              </CardHeader>
              <CardContent>
                {supplier.supplierProfile.isOfflineContractDone ? (
                  // Completed State
                  <div
                    className="p-5 rounded-lg"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      boxShadow: 'var(--shadow-card), inset 0 0 0 1px var(--status-success-border)',
                    }}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className="p-2 rounded-full"
                        style={{ backgroundColor: 'var(--status-success-bg)' }}
                      >
                        <CheckCircle2
                          className="w-6 h-6"
                          style={{ color: 'var(--status-success)' }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                          Contract Verified Successfully
                        </h4>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          This supplier is authorized to publish datasets on the marketplace.
                        </p>
                      </div>
                    </div>

                    <div
                      className="h-px mb-4"
                      style={{ backgroundColor: 'var(--border-default)' }}
                    />

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <p
                          className="text-xs font-medium uppercase tracking-wide mb-2 block"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Completed Date & Time
                        </p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {supplier.supplierProfile.offlineContractDoneAt
                              ? new Date(
                                  supplier.supplierProfile.offlineContractDoneAt
                                ).toLocaleString('en-US', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })
                              : '—'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p
                          className="text-xs font-medium uppercase tracking-wide mb-2 block"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Verified By
                        </p>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                          <div>
                            <p
                              className="text-sm font-medium"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {supplier.supplierProfile.offlineContractDoneByAdmin?.name ||
                                'Admin unavailable'}
                            </p>
                            {supplier.supplierProfile.offlineContractDoneByAdmin?.email ? (
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {supplier.supplierProfile.offlineContractDoneByAdmin.email}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Pending State
                  <div className="space-y-4">
                    <div
                      className="p-4 rounded-lg"
                      style={{
                        backgroundColor: 'var(--status-warning-bg)',
                        boxShadow:
                          'var(--shadow-card), inset 0 0 0 1px var(--status-warning-border)',
                      }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <AlertCircle
                          className="w-5 h-5 flex-shrink-0 mt-0.5"
                          style={{ color: 'var(--status-warning)' }}
                        />
                        <div>
                          <h4
                            className="font-semibold mb-1"
                            style={{ color: 'var(--status-warning)' }}
                          >
                            Action Required: Contract Verification Pending
                          </h4>
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            The supplier cannot publish datasets until the offline contract has been
                            verified and marked as complete. Please ensure all contractual documents
                            have been reviewed and signed before proceeding.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-5 rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                      }}
                    >
                      <h4 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        Before Marking as Complete:
                      </h4>
                      <ul className="space-y-2 mb-4">
                        <li
                          className="flex items-start gap-2 text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <CheckCircle2
                            className="w-4 h-4 flex-shrink-0 mt-0.5"
                            style={{ color: 'var(--text-muted)' }}
                          />
                          <span>Verify all contract documents are signed and received</span>
                        </li>
                        <li
                          className="flex items-start gap-2 text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <CheckCircle2
                            className="w-4 h-4 flex-shrink-0 mt-0.5"
                            style={{ color: 'var(--text-muted)' }}
                          />
                          <span>Confirm supplier identity and business details</span>
                        </li>
                        <li
                          className="flex items-start gap-2 text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <CheckCircle2
                            className="w-4 h-4 flex-shrink-0 mt-0.5"
                            style={{ color: 'var(--text-muted)' }}
                          />
                          <span>Review KYC verification status above</span>
                        </li>
                      </ul>

                      {canManageVerification ? (
                        <Button
                          onClick={() => setContractDialogOpen(true)}
                          disabled={isMarkingContractDone}
                          className="w-full h-12 text-base font-semibold"
                          size="lg"
                        >
                          {isMarkingContractDone ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Processing Verification...
                            </>
                          ) : (
                            <>
                              <FileCheck className="w-5 h-5 mr-2" />
                              Mark Offline Contract as Complete
                            </>
                          )}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verification Status */}
            <Card
              style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
            >
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
                <CardDescription>Email verification and account status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p
                      className="text-sm font-medium mb-2 block"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Contact Email
                    </p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {supplier.supplierProfile.contactEmail}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium mb-2 block"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Verification Status
                    </p>
                    <div className="flex items-center gap-2">
                      {supplier.supplierProfile.contactEmailVerified ? (
                        <>
                          <CheckCircle2
                            className="w-4 h-4"
                            style={{ color: 'var(--status-success)' }}
                          />
                          <span
                            className="text-sm font-medium"
                            style={{ color: 'var(--status-success)' }}
                          >
                            Verified
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" style={{ color: 'var(--status-warning)' }} />
                          <span
                            className="text-sm font-medium"
                            style={{ color: 'var(--status-warning)' }}
                          >
                            Not Verified
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {supplier.supplierProfile.contactEmailVerified &&
                  supplier.supplierProfile.contactEmailVerifiedAt && (
                    <div
                      className="p-3 rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                      }}
                    >
                      <p
                        className="text-xs font-medium mb-1 block"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Verified On
                      </p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                          {new Date(supplier.supplierProfile.contactEmailVerifiedAt).toLocaleString(
                            'en-US',
                            {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Account Activity */}
            <Card
              style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
            >
              <CardHeader>
                <CardTitle>Account Activity</CardTitle>
                <CardDescription>Account status and history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      Created At
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-primary)' }}>
                        {new Date(supplier.supplier.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      Last Updated
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-primary)' }}>
                        {new Date(supplier.supplier.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {supplier.supplier.lastLoginAt && (
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      Last Login
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-primary)' }}>
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
              <Card
                style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
              >
                <CardContent className="py-8">
                  <div className="text-center">
                    <p style={{ color: 'var(--text-muted)' }}>Loading KYC details...</p>
                  </div>
                </CardContent>
              </Card>
            ) : isKycError ? (
              <Card
                style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
              >
                <CardContent className="py-10 text-center">
                  <AlertCircle
                    className="mx-auto h-8 w-8 text-[var(--state-error)]"
                    aria-hidden="true"
                  />
                  <p className="mt-3 font-medium">Could not load KYC details</p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {getFriendlyErrorMessage(kycError)}
                  </p>
                  <Button className="mt-4" variant="outline" onClick={() => refetchKyc()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card
                style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
                    KYC Verification Details
                  </CardTitle>
                  <CardDescription>
                    Complete Know Your Customer verification information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {kycData?.kyc ? (
                    <div className="space-y-6">
                      {/* KYC Overview */}
                      <div
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-4 rounded-lg"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-default)',
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                            Status
                          </p>
                          <div className="mt-1">
                            <StatusBadge
                              status={formatStatusLabel(kycData.kyc.status)}
                              semanticType={getKYCStatusSemantic(kycData.kyc.status)}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                            Provider
                          </p>
                          <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                            {kycData.kyc.provider}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                            Created At
                          </p>
                          <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                            {new Date(kycData.kyc.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                            Last Updated
                          </p>
                          <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                            {new Date(kycData.kyc.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {kycData.kyc.failureReason && (
                        <div
                          className="p-4 rounded-lg"
                          style={{
                            backgroundColor: 'var(--status-error-bg)',
                            border: '1px solid var(--status-error)',
                          }}
                        >
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--status-error)' }}
                          >
                            Failure Reason
                          </p>
                          <p className="mt-1" style={{ color: 'var(--status-error)' }}>
                            {kycData.kyc.failureReason}
                          </p>
                        </div>
                      )}

                      {/* KYC Checks */}
                      {kycData.kyc.checks && kycData.kyc.checks.length > 0 && (
                        <div>
                          <h3
                            className="text-lg font-semibold mb-4"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            Verification Checks
                          </h3>
                          <div className="space-y-3">
                            {kycData.kyc.checks.map((check) => (
                              <div
                                key={check.id}
                                className="p-4 rounded-lg"
                                style={{
                                  backgroundColor: 'var(--bg-surface)',
                                  border: '1px solid var(--border-default)',
                                }}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4
                                        className="font-medium"
                                        style={{ color: 'var(--text-primary)' }}
                                      >
                                        {formatEnumLabel(check.checkType)}
                                      </h4>
                                      <StatusBadge
                                        status={formatStatusLabel(check.status)}
                                        semanticType={getKYCStatusSemantic(check.status)}
                                      />
                                    </div>
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                      Value: {check.valueMasked}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                                  {check.submittedAt && (
                                    <div>
                                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        Submitted At
                                      </p>
                                      <p
                                        className="text-xs mt-0.5"
                                        style={{ color: 'var(--text-secondary)' }}
                                      >
                                        {new Date(check.submittedAt).toLocaleString()}
                                      </p>
                                    </div>
                                  )}
                                  {check.verifiedAt && (
                                    <div>
                                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        Verified At
                                      </p>
                                      <p
                                        className="text-xs mt-0.5"
                                        style={{ color: 'var(--text-secondary)' }}
                                      >
                                        {new Date(check.verifiedAt).toLocaleString()}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {check.providerRequestId || check.providerReferenceId ? (
                                  <details
                                    className="mt-4 rounded-md border p-3"
                                    style={{ borderColor: 'var(--border-default)' }}
                                  >
                                    <summary className="cursor-pointer text-xs font-medium text-[var(--text-secondary)]">
                                      Provider diagnostics
                                    </summary>
                                    <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                      {check.providerRequestId ? (
                                        <div>
                                          <dt className="text-xs text-[var(--text-muted)]">
                                            Provider request
                                          </dt>
                                          <dd className="mt-0.5 break-all font-mono text-xs text-[var(--text-secondary)]">
                                            {check.providerRequestId}
                                          </dd>
                                        </div>
                                      ) : null}
                                      {check.providerReferenceId ? (
                                        <div>
                                          <dt className="text-xs text-[var(--text-muted)]">
                                            Provider reference
                                          </dt>
                                          <dd className="mt-0.5 break-all font-mono text-xs text-[var(--text-secondary)]">
                                            {check.providerReferenceId}
                                          </dd>
                                        </div>
                                      ) : null}
                                    </dl>
                                  </details>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield
                        className="w-12 h-12 mx-auto mb-3"
                        style={{ color: 'var(--text-muted)' }}
                      />
                      <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        KYC Not Started
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
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

      <Dialog
        open={contractDialogOpen}
        onOpenChange={(open) => {
          if (!isMarkingContractDone) setContractDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm offline contract completion</DialogTitle>
            <DialogDescription>
              Only continue after all signed contract documents and supplier details have been
              verified. This action enables the supplier to publish datasets and is recorded against
              your admin account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setContractDialogOpen(false)}
              disabled={isMarkingContractDone}
            >
              Cancel
            </Button>
            <Button onClick={handleMarkOfflineContractDone} disabled={isMarkingContractDone}>
              {isMarkingContractDone ? 'Saving…' : 'Confirm completion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
