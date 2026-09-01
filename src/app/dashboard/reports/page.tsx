'use client';

import { AlertTriangle, FileSpreadsheet, PlayCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRunDailyDatasetReport } from '@/hooks';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';

export default function ReportsPage() {
  const runDailyReportMutation = useRunDailyDatasetReport();
  const { can } = useAuthorization();
  const canViewReportsPage = can({
    anyOf: [PERMISSIONS.REPORTS.VIEW, PERMISSIONS.REPORTS.EXPORT],
  });
  const canRunDailyReport = can({ anyOf: [PERMISSIONS.REPORTS.EXPORT] });

  const handleRun = () => {
    runDailyReportMutation.mutate();
  };

  const response = runDailyReportMutation.data;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div
        className="border-b p-4 sm:p-6"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Reports
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          View available reports and trigger exports your role permits.
        </p>
      </div>

      <div className="p-4 sm:p-6">
        <Card style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Daily Dataset Analytics Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Triggers report generation for the previous day and emails the Excel attachment to
              configured recipients.
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                onClick={handleRun}
                disabled={
                  !canViewReportsPage || !canRunDailyReport || runDailyReportMutation.isPending
                }
                className="gap-2"
              >
                <PlayCircle className="h-4 w-4" />
                {runDailyReportMutation.isPending ? 'Running...' : 'Run Daily Report Now'}
              </Button>
            </div>

            {response && (
              <div
                className="rounded-md border p-3 text-sm"
                style={{ borderColor: 'var(--border-default)' }}
              >
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
