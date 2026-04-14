'use client';

import { AlertTriangle, FileSpreadsheet, PlayCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser, useRunDailyDatasetReport } from '@/hooks';
import { useAuthStore } from '@/store/auth.store';

export default function ReportsPage() {
  const runDailyReportMutation = useRunDailyDatasetReport();
  const { data: currentUser } = useCurrentUser({
    refetchOnMount: false,
    retry: false,
  });
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);

  const effectiveUser = currentUser ?? user;
  const isSuperadmin = effectiveUser?.userType === 'SUPERADMIN';
  const canViewReportsPage = isSuperadmin || permissions.includes('VIEW_REPORTS') || permissions.includes('EXPORT_REPORTS');
  const canRunDailyReport =
    isSuperadmin || permissions.includes('EXPORT_REPORTS');

  const handleRun = () => {
    runDailyReportMutation.mutate();
  };

  const response = runDailyReportMutation.data;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div
        className="p-6 border-b"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Reports
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Run and monitor administrative report actions.
        </p>
      </div>

      <div className="p-6">
        <Card style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Daily Dataset Analytics Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Triggers report generation for the previous day and emails the Excel attachment to configured recipients.
            </p>

            {!canViewReportsPage && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Access Restricted</AlertTitle>
                <AlertDescription>
                  You need VIEW_REPORTS or EXPORT_REPORTS permission to access this page.
                </AlertDescription>
              </Alert>
            )}

            {canViewReportsPage && !canRunDailyReport && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Permission Required</AlertTitle>
                <AlertDescription>
                  You need the EXPORT_REPORTS permission to run this report manually.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-3">
              <Button
                onClick={handleRun}
                disabled={!canViewReportsPage || !canRunDailyReport || runDailyReportMutation.isPending}
                className="gap-2"
              >
                <PlayCircle className="h-4 w-4" />
                {runDailyReportMutation.isPending ? 'Running...' : 'Run Daily Report Now'}
              </Button>
            </div>

            {response && (
              <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'var(--border-default)' }}>
                <p style={{ color: 'var(--text-primary)' }}>
                  <strong>Status:</strong> {response.message}
                </p>
                <p style={{ color: 'var(--text-muted)' }}>
                  <strong>Report date:</strong> {response.reportDate}
                </p>
                <p style={{ color: 'var(--text-muted)' }}>
                  <strong>Attempts:</strong> {response.attempts}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
