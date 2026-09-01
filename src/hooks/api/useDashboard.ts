import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary, getDatasetRatings } from '@/services/dashboard.service';
import type { DatasetRatingsSort } from '@/types';

const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
  ratings: (params: { page: number; pageSize: number; q?: string; sort: DatasetRatingsSort }) =>
    [...dashboardKeys.all, 'dataset-ratings', params] as const,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: getDashboardSummary,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}

export function useDatasetRatings(params: {
  page: number;
  pageSize: number;
  q?: string;
  sort: DatasetRatingsSort;
}) {
  return useQuery({
    queryKey: dashboardKeys.ratings(params),
    queryFn: () => getDatasetRatings(params),
    placeholderData: (previousData) => previousData,
  });
}
