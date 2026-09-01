'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileWarning,
  RefreshCw,
  UserRoundCheck,
  UsersRound,
  XCircle,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SignalCard } from '@/components/dashboard/SignalCard';
import { WorkloadCard } from '@/components/dashboard/WorkloadCard';
import { AlertItem } from '@/components/dashboard/AlertItem';
import { useDashboardSummary } from '@/hooks';

export default function DashboardPage() {
  const router = useRouter();
  const summaryQuery = useDashboardSummary();
  const summary = summaryQuery.data;

  const marketplaceSignals = useMemo(
    () => [
      {
        id: 'unassigned',
        label: 'Unassigned reviews',
        count: summary?.signals.unassignedReviews ?? null,
        status: 'warning' as const,
        icon: UsersRound,
        href: '/dashboard/proposals?assignment=UNASSIGNED',
      },
      {
        id: 'in-review',
        label: 'Currently in review',
        count: summary?.signals.inReview ?? null,
        status: 'info' as const,
        icon: FileWarning,
        href: '/dashboard/proposals?verification=UNDER_REVIEW',
      },
      {
        id: 'changes-requested',
        label: 'Changes requested',
        count: summary?.signals.changesRequested ?? null,
        status: 'warning' as const,
        icon: XCircle,
        href: '/dashboard/proposals?verification=CHANGES_REQUESTED',
      },
      {
        id: 'published',
        label: 'Published in last 7 days',
        count: summary?.signals.publishedLastSevenDays ?? null,
        status: 'success' as const,
        icon: CheckCircle2,
        href: '/dashboard/datasets?status=PUBLISHED',
      },
      {
        id: 'supplier-kyc',
        label: 'Pending supplier KYC',
        count: summary?.signals.pendingSupplierKyc ?? null,
        status: 'warning' as const,
        icon: ClipboardList,
        href: '/dashboard/supplier-kyc',
      },
      {
        id: 'unresolved',
        label: 'Unresolved over 48 hours',
        count: summary?.signals.unresolvedOverFortyEightHours ?? null,
        status: 'error' as const,
        icon: AlertCircle,
        href: '/dashboard/proposals',
      },
    ],
    [summary]
  );

  const workload = useMemo(
    () => [
      {
        id: 'assigned',
        label: 'Assigned to me',
        count: summary?.workload.assignedToMe ?? null,
        icon: UserRoundCheck,
        href: '/dashboard/my-queue?status=ACTIVE',
      },
      {
        id: 'completed',
        label: 'Completed today (UTC)',
        count: summary?.workload.completedTodayUtc ?? null,
        icon: FileCheck2,
        href: '/dashboard/my-queue?status=COMPLETED',
      },
    ],
    [summary]
  );

  const visibleSignals = summaryQuery.isLoading
    ? marketplaceSignals
    : marketplaceSignals.filter((signal) => signal.count !== null);
  const visibleWorkload = summaryQuery.isLoading
    ? workload
    : workload.filter((item) => item.count !== null);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.16em]"
            style={{ color: 'var(--text-muted)' }}
          >
            Operations overview
          </p>
          <h1 className="mt-1" style={{ color: 'var(--text-primary)' }}>
            Dashboard
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
            Live review queues and the work that needs your attention.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {summary?.generatedAt ? (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Updated{' '}
              {new Date(summary.generatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => summaryQuery.refetch()}
            disabled={summaryQuery.isFetching}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${summaryQuery.isFetching ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Refresh
          </Button>
        </div>
      </div>

      {summaryQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dashboard data is unavailable</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>No fallback values are shown because they could be misleading.</span>
            <Button variant="outline" size="sm" onClick={() => summaryQuery.refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {visibleSignals.length > 0 ? (
        <section aria-labelledby="marketplace-signals-heading">
          <div className="mb-4">
            <h2 id="marketplace-signals-heading">Marketplace signals</h2>
            <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
              Counts reflect the current backend state and your granted access.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {visibleSignals.map((signal) => (
              <SignalCard
                key={signal.id}
                label={signal.label}
                count={signal.count}
                status={signal.status}
                icon={signal.icon}
                isLoading={summaryQuery.isLoading}
                onClick={() => router.push(signal.href)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {visibleWorkload.length > 0 ? (
        <section aria-labelledby="personal-workload-heading">
          <h2 id="personal-workload-heading">Personal workload</h2>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
            Active assignments and completions attributed to your account.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-3xl">
            {visibleWorkload.map((item) => (
              <WorkloadCard
                key={item.id}
                label={item.label}
                count={item.count}
                isLoading={summaryQuery.isLoading}
                onClick={() => router.push(item.href)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {!summaryQuery.isLoading &&
      !summaryQuery.isError &&
      visibleSignals.length === 0 &&
      visibleWorkload.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Clock3 className="mx-auto h-8 w-8" style={{ color: 'var(--text-muted)' }} />
            <h2 className="mt-3 text-lg">No operational queues are assigned</h2>
            <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
              Use the navigation to access the sections available to your role.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!summaryQuery.isLoading && !summaryQuery.isError ? (
        <section aria-labelledby="attention-heading">
          <h2 id="attention-heading">Attention required</h2>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
            Operational alerts are generated from current queue thresholds.
          </p>
          <div className="mt-4">
            {summary?.alerts.length ? (
              <div className="space-y-3">
                {summary.alerts.map((alert) => (
                  <AlertItem key={alert.id} {...alert} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center gap-3 p-5">
                  <CheckCircle2
                    className="h-5 w-5 shrink-0"
                    style={{ color: 'var(--state-success)' }}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      No current operational alerts
                    </p>
                    <p style={{ color: 'var(--text-muted)' }}>
                      Available queues are within the configured attention thresholds.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
