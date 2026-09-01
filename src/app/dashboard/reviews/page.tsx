'use client';

import { useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, MessageSquare, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDatasetRatings } from '@/hooks/api/useDashboard';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuthorization } from '@/hooks/useAuthorization';
import { DATASET_REVIEW_ACCESS, PLATFORM_DATASET_ACCESS } from '@/lib/authorization/route-access';
import type { DatasetRatingItem, DatasetRatingsSort } from '@/types';

const PAGE_SIZE = 20;
const SORT_OPTIONS: readonly DatasetRatingsSort[] = [
  'reviews:desc',
  'rating:desc',
  'publishedAt:desc',
];

const getPositivePage = (value: string | null) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const getSort = (value: string | null): DatasetRatingsSort =>
  SORT_OPTIONS.includes(value as DatasetRatingsSort)
    ? (value as DatasetRatingsSort)
    : 'reviews:desc';

const getDatasetHref = (item: DatasetRatingItem) =>
  item.ownerType === 'PLATFORM'
    ? `/dashboard/platform-datasets/${item.id}`
    : `/dashboard/datasets/${item.id}`;

const getRatingLabel = (rating: number, reviewCount: number) => {
  if (reviewCount === 0) return { label: 'Awaiting reviews', color: 'var(--text-muted)' };
  if (rating >= 4) return { label: 'Excellent', color: 'var(--state-success)' };
  if (rating >= 3) return { label: 'Good', color: 'var(--state-warning)' };
  return { label: 'Needs attention', color: 'var(--state-error)' };
};

function RatingValue({ item }: { item: DatasetRatingItem }) {
  const rating = Number(item.rating ?? 0);
  if (item.reviewCount === 0 || !Number.isFinite(rating)) {
    return <span style={{ color: 'var(--text-muted)' }}>Not rated</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 font-semibold tabular-nums">
      <Star
        className="h-4 w-4 fill-[var(--state-warning)] text-[var(--state-warning)]"
        aria-hidden="true"
      />
      {rating.toFixed(1)}
      <span className="sr-only"> out of 5</span>
    </span>
  );
}

function DatasetTitleLink({ item, canOpen }: { item: DatasetRatingItem; canOpen: boolean }) {
  if (!canOpen) return <span className="font-semibold">{item.title}</span>;

  return (
    <Link
      href={getDatasetHref(item)}
      className="font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
    >
      {item.title}
    </Link>
  );
}

export default function AdminReviewsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') ?? '';
  const debouncedSearch = useDebounce(searchQuery, 350);
  const page = getPositivePage(searchParams.get('page'));
  const sort = getSort(searchParams.get('sort'));
  const { can } = useAuthorization();
  const canOpenPlatformDataset = can(PLATFORM_DATASET_ACCESS);
  const canOpenSupplierDataset = can(DATASET_REVIEW_ACCESS);
  const canOpenDataset = (item: DatasetRatingItem) =>
    item.ownerType === 'PLATFORM' ? canOpenPlatformDataset : canOpenSupplierDataset;

  const query = useDatasetRatings({
    page,
    pageSize: PAGE_SIZE,
    q: debouncedSearch || undefined,
    sort,
  });
  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const total = query.data?.pagination.total ?? 0;
  const totalPages = Math.max(1, query.data?.pagination.totalPages ?? 1);

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) next.delete(key);
        else next.set(key, value);
      });
      const queryString = next.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (!query.isFetching && total > 0 && page > totalPages) {
      updateUrl({ page: totalPages > 1 ? String(totalPages) : null });
    }
  }, [page, query.isFetching, total, totalPages, updateUrl]);

  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6">
      <div className="mb-6">
        <h1>Reviews</h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
          Monitor ratings and review volume across published marketplace datasets.
        </p>
      </div>

      <Card style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}>
        <CardHeader
          className="gap-4 border-b sm:flex-row sm:items-end sm:justify-between"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div>
            <CardTitle>Dataset ratings</CardTitle>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Published platform and supplier datasets only.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[minmax(240px,320px)_190px]">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
                aria-hidden="true"
              />
              <Input
                type="search"
                aria-label="Search dataset ratings"
                placeholder="Search title or dataset ID"
                value={searchQuery}
                onChange={(event) =>
                  updateUrl({ q: event.target.value.trimStart() || null, page: null })
                }
                className="pl-9"
              />
            </div>
            <Select
              value={sort}
              onValueChange={(value: DatasetRatingsSort) =>
                updateUrl({ sort: value === 'reviews:desc' ? null : value, page: null })
              }
            >
              <SelectTrigger aria-label="Sort dataset ratings">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reviews:desc">Most reviews</SelectItem>
                <SelectItem value="rating:desc">Highest rating</SelectItem>
                <SelectItem value="publishedAt:desc">Recently published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {query.isLoading ? (
            <div className="space-y-3 p-4 sm:p-6" aria-label="Loading dataset ratings">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-lg bg-[var(--bg-hover)]" />
              ))}
            </div>
          ) : query.isError ? (
            <div className="px-6 py-14 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-destructive" aria-hidden="true" />
              <p className="mt-3 font-medium">Could not load dataset ratings</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                The ratings service did not return a usable response.
              </p>
              <Button className="mt-4" variant="outline" onClick={() => query.refetch()}>
                Try again
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <MessageSquare
                className="mx-auto h-8 w-8"
                style={{ color: 'var(--text-muted)' }}
                aria-hidden="true"
              />
              <p className="mt-3 font-medium">No published datasets found</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                {debouncedSearch
                  ? 'Try a different title or dataset ID.'
                  : 'Ratings will appear after a dataset is published.'}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y md:hidden" style={{ borderColor: 'var(--border-subtle)' }}>
                {items.map((item) => {
                  const rating = Number(item.rating ?? 0);
                  const status = getRatingLabel(rating, item.reviewCount);
                  return (
                    <article key={item.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <DatasetTitleLink item={item} canOpen={canOpenDataset(item)} />
                          <p
                            className="mt-1 truncate text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {item.datasetUniqueId} ·{' '}
                            {item.ownerType === 'PLATFORM' ? 'Platform' : 'Supplier'}
                          </p>
                        </div>
                        <RatingValue item={item} />
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {item.reviewCount} review{item.reviewCount === 1 ? '' : 's'}
                        </span>
                        <span className="font-medium" style={{ color: status.color }}>
                          {status.label}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr
                      className="border-b bg-[var(--bg-surface)]"
                      style={{ borderColor: 'var(--border-default)' }}
                    >
                      {['Dataset', 'Owner', 'Rating', 'Reviews', 'Assessment'].map((heading) => (
                        <th
                          key={heading}
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const rating = Number(item.rating ?? 0);
                      const status = getRatingLabel(rating, item.reviewCount);
                      return (
                        <tr
                          key={item.id}
                          className="border-b transition-colors last:border-b-0 hover:bg-[var(--bg-hover)]"
                          style={{ borderColor: 'var(--border-subtle)' }}
                        >
                          <td className="px-4 py-4">
                            <DatasetTitleLink item={item} canOpen={canOpenDataset(item)} />
                            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                              {item.datasetUniqueId}
                            </p>
                          </td>
                          <td
                            className="px-4 py-4 text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {item.ownerType === 'PLATFORM' ? 'Platform' : 'Supplier'}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <RatingValue item={item} />
                          </td>
                          <td
                            className="px-4 py-4 text-sm tabular-nums"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {item.reviewCount}
                          </td>
                          <td
                            className="px-4 py-4 text-sm font-medium"
                            style={{ color: status.color }}
                          >
                            {status.label}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!query.isLoading && !query.isError && total > 0 ? (
            <div
              className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Showing {start}–{end} of {total} published datasets
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || query.isFetching}
                  onClick={() => updateUrl({ page: page - 1 > 1 ? String(page - 1) : null })}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || query.isFetching}
                  onClick={() => updateUrl({ page: String(page + 1) })}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
