/** Production adoption requires the coordinated backend/schema/storage release. */
export const DATASET_CONTENT_ADMIN_ENABLED =
  process.env.NEXT_PUBLIC_APP_ENV === 'staging' ||
  process.env.NEXT_PUBLIC_APP_ENV === 'local' ||
  (process.env.NEXT_PUBLIC_APP_ENV === 'production' &&
    process.env.NEXT_PUBLIC_DATASET_CONTENT_ENABLED === 'true') ||
  (!process.env.NEXT_PUBLIC_APP_ENV && process.env.NODE_ENV !== 'production');
