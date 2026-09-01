import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import * as reportsService from '@/services/reports.service';
import { getFriendlyErrorMessage, isSessionExpiredError } from '@/lib/utils/error.utils';

export function useRunDailyDatasetReport() {
  return useMutation({
    mutationFn: reportsService.runDailyDatasetReport,
    onSuccess: (data) => {
      toast.success(data.message || 'Daily dataset report queued successfully');
    },
    onError: (error) => {
      if (isSessionExpiredError(error)) return;
      toast.error(getFriendlyErrorMessage(error) || 'Failed to run daily dataset report');
    },
  });
}
