/** Dataset content adoption is limited to isolated staging/local testing. */
export const DATASET_CONTENT_ADMIN_ENABLED =
  process.env.NEXT_PUBLIC_APP_ENV === 'staging' ||
  process.env.NEXT_PUBLIC_APP_ENV === 'local' ||
  (!process.env.NEXT_PUBLIC_APP_ENV && process.env.NODE_ENV !== 'production');
