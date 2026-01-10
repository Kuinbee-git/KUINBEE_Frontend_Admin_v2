/**
 * Application Routes
 * Centralized route definitions for type-safe navigation
 */

export const ROUTES = {
  // Root
  HOME: '/',

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // Dashboard
  DASHBOARD: '/dashboard',

  // Datasets
  DATASETS: '/datasets',
  DATASET_DETAIL: (id: string) => `/datasets/${id}`,

  // Suppliers
  SUPPLIERS: '/suppliers',
  SUPPLIER_DETAIL: (id: string) => `/suppliers/${id}`,

  // Categories & Sources
  CATEGORIES: '/categories',
  SOURCES: '/sources',

  // Users & Admins
  USERS_ADMINS_INDEX: '/users-admins',
  USERS: '/users',
  USER_DETAIL: (id: string) => `/users/${id}`,
  ADMINS: '/admins',
  ADMIN_DETAIL: (id: string) => `/admins/${id}`,

  // Reports
  REPORTS: '/reports',

  // API
  API: {
    AUTH: '/api/auth',
    DATASETS: '/api/datasets',
    SUPPLIERS: '/api/suppliers',
    USERS: '/api/users',
    ADMINS: '/api/admins',
  },
} as const;
