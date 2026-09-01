type DashboardMetricValue = number | null;

interface DashboardAlert {
  id: string;
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  href: string;
}

export interface DashboardSummary {
  generatedAt: string;
  signals: {
    unassignedReviews: DashboardMetricValue;
    inReview: DashboardMetricValue;
    changesRequested: DashboardMetricValue;
    pendingSupplierKyc: DashboardMetricValue;
    publishedLastSevenDays: DashboardMetricValue;
    unresolvedOverFortyEightHours: DashboardMetricValue;
  };
  workload: {
    assignedToMe: DashboardMetricValue;
    completedTodayUtc: DashboardMetricValue;
  };
  alerts: DashboardAlert[];
}

export type DatasetRatingsSort = 'reviews:desc' | 'rating:desc' | 'publishedAt:desc';

export interface DatasetRatingItem {
  id: string;
  datasetUniqueId: string;
  title: string;
  ownerType: 'PLATFORM' | 'SUPPLIER';
  rating: string | null;
  reviewCount: number;
  publishedAt: string | null;
}
