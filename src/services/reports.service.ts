import { apiClient } from '@/lib/api/client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import type { ApiSuccessResponse } from '@/types';

export interface RunDailyDatasetReportResponse {
  message: string;
  reportDate: string;
  attempts: number;
}

export async function runDailyDatasetReport(): Promise<RunDailyDatasetReportResponse> {
  const response = await apiClient.post<ApiSuccessResponse<RunDailyDatasetReportResponse>>(
    API_ROUTES.ADMIN.REPORTS.RUN_DAILY_DATASET
  );

  return response.data.data;
}
