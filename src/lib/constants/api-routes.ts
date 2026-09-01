/**
 * Backend API Routes
 * Matches backend /api/v1/* structure
 * All routes are relative to BASE_URL
 */

export const API_ROUTES = {
  // Base
  BASE: '/v1',
  HEALTH: '/health',

  // ============================================
  // AUTH ROUTES (/api/v1/auth)
  // ============================================
  AUTH: {
    LOGIN: '/v1/auth/login',
    LOGOUT: '/v1/auth/logout',
    ME: '/v1/auth/me',
    ACCEPT_INVITE: '/v1/auth/admin/accept-invite',
    ADMIN_PASSWORD_RESET_REQUEST: '/v1/auth/admin/password/reset/request',
    ADMIN_PASSWORD_RESET_CONFIRM: '/v1/auth/admin/password/reset/confirm',
    ADMIN_PASSWORD_CHANGE: '/v1/auth/admin/password/change',
  },

  // ============================================
  // PERMISSIONS (/api/v1/enums/permissions)
  // ============================================
  PERMISSIONS: '/v1/enums/permissions',

  // ============================================
  // ADMIN ROUTES (/api/v1/admin)
  // ============================================
  MARKETPLACE: {
    QUESTION_DATASETS: '/v1/marketplace/questions/datasets',
    QUESTIONS: (datasetId: string) => `/v1/marketplace/datasets/${datasetId}/questions`,
    ANSWER_QUESTION: (questionId: string) => `/v1/marketplace/questions/${questionId}/answers`,
    DELETE_QUESTION: (questionId: string) => `/v1/marketplace/questions/${questionId}`,
  },

  ADMIN: {
    DASHBOARD: {
      SUMMARY: '/v1/admin/dashboard/summary',
      DATASET_RATINGS: '/v1/admin/dashboard/dataset-ratings',
    },
    // Self
    MY_PERMISSIONS: '/v1/admin/my-permissions',

    // Profile
    PROFILE: '/v1/admin/me/profile',

    // Addresses
    ADDRESSES: {
      LIST: '/v1/admin/me/addresses',
      CREATE: '/v1/admin/me/addresses',
      UPDATE: (addressId: string) => `/v1/admin/me/addresses/${addressId}`,
      DELETE: (addressId: string) => `/v1/admin/me/addresses/${addressId}`,
    },

    // Dataset Proposals (Stage 2)
    DATASET_PROPOSALS: {
      LIST: '/v1/admin/dataset-proposals',
      REVIEW: (datasetId: string) => `/v1/admin/dataset-proposals/${datasetId}/review`,
      PICK: (datasetId: string) => `/v1/admin/dataset-proposals/${datasetId}/pick`,
      DOWNLOAD_URL: (datasetId: string) =>
        `/v1/admin/dataset-proposals/${datasetId}/current-upload/download-url`,
      SAMPLE_DOWNLOAD_URL: (datasetId: string) =>
        `/v1/admin/dataset-proposals/${datasetId}/sample-upload/download-url`,
      APPROVE: (datasetId: string) => `/v1/admin/dataset-proposals/${datasetId}/approve`,
      REJECT: (datasetId: string) => `/v1/admin/dataset-proposals/${datasetId}/reject`,
      REQUEST_CHANGES: (datasetId: string) =>
        `/v1/admin/dataset-proposals/${datasetId}/request-changes`,
      // Pricing Review
      PRICING: {
        GET: (datasetId: string) => `/v1/admin/dataset-proposals/${datasetId}/pricing`,
        APPROVE: (datasetId: string) => `/v1/admin/dataset-proposals/${datasetId}/pricing/approve`,
        REJECT: (datasetId: string) => `/v1/admin/dataset-proposals/${datasetId}/pricing/reject`,
        REQUEST_CHANGES: (datasetId: string) =>
          `/v1/admin/dataset-proposals/${datasetId}/pricing/request-changes`,
      },
    },

    DISCOUNT_PROPOSALS: {
      LIST: '/v1/admin/discount-proposals',
      REVIEW: (discountProposalId: string) =>
        `/v1/admin/discount-proposals/${discountProposalId}/review`,
      APPROVE: (discountProposalId: string) =>
        `/v1/admin/discount-proposals/${discountProposalId}/approve`,
      REJECT: (discountProposalId: string) =>
        `/v1/admin/discount-proposals/${discountProposalId}/reject`,
    },

    // Dataset Update Requests
    DATASET_UPDATE_REQUESTS: {
      LIST: '/v1/admin/dataset-update-requests',
      PICK: (datasetId: string) => `/v1/admin/dataset-update-requests/${datasetId}/pick`,
      APPROVE: (datasetId: string) => `/v1/admin/dataset-update-requests/${datasetId}/approve`,
      REJECT: (datasetId: string) => `/v1/admin/dataset-update-requests/${datasetId}/reject`,
      REQUEST_CHANGES: (datasetId: string) =>
        `/v1/admin/dataset-update-requests/${datasetId}/request-changes`,
      PRICING: {
        GET: (datasetId: string) => `/v1/admin/dataset-update-requests/${datasetId}/pricing`,
        APPROVE: (datasetId: string) =>
          `/v1/admin/dataset-update-requests/${datasetId}/pricing/approve`,
        REJECT: (datasetId: string) =>
          `/v1/admin/dataset-update-requests/${datasetId}/pricing/reject`,
        REQUEST_CHANGES: (datasetId: string) =>
          `/v1/admin/dataset-update-requests/${datasetId}/pricing/request-changes`,
      },
    },

    // Assigned Datasets
    ASSIGNED_DATASETS: '/v1/admin/assigned-datasets',

    // Categories (Stage 3)
    CATEGORIES: {
      LIST: '/v1/admin/categories',
      CREATE: '/v1/admin/categories',
      UPDATE: (categoryId: string) => `/v1/admin/categories/${categoryId}`,
      DELETE: (categoryId: string) => `/v1/admin/categories/${categoryId}`,
    },

    // Sources (Stage 3)
    SOURCES: {
      LIST: '/v1/admin/sources',
      CREATE: '/v1/admin/sources',
      UPDATE: (sourceId: string) => `/v1/admin/sources/${sourceId}`,
      DELETE: (sourceId: string) => `/v1/admin/sources/${sourceId}`,
    },

    // Platform Datasets (Stage 4)
    DATASETS: {
      LIST: '/v1/admin/datasets',
      DETAIL: (datasetId: string) => `/v1/admin/datasets/${datasetId}`,
      CREATE: '/v1/admin/datasets',
      UPDATE: (datasetId: string) => `/v1/admin/datasets/${datasetId}`,
      DELETE: (datasetId: string) => `/v1/admin/datasets/${datasetId}`,
      PUBLISH: (datasetId: string) => `/v1/admin/datasets/${datasetId}/publish`,
      UNPUBLISH: (datasetId: string) => `/v1/admin/datasets/${datasetId}/unpublish`,
      METADATA: (datasetId: string) => `/v1/admin/datasets/${datasetId}/metadata`,
      AUDIT: (datasetId: string) => `/v1/admin/datasets/${datasetId}/audit`,

      // Uploads
      UPLOADS: {
        LIST: (datasetId: string) => `/v1/admin/datasets/${datasetId}/uploads`,
        START: (datasetId: string) => `/v1/admin/datasets/${datasetId}/uploads/start`,
        COMPLETE: (datasetId: string, uploadId: string) =>
          `/v1/admin/datasets/${datasetId}/uploads/${uploadId}/complete`,
        DOWNLOAD_URL: (datasetId: string, uploadId: string) =>
          `/v1/admin/datasets/${datasetId}/uploads/${uploadId}/download-url`,
      },

      // KDTS Scoring
      KDTS: {
        GET: (datasetId: string) => `/v1/admin/kdts/${datasetId}`,
        CREATE_UPDATE: (datasetId: string) => `/v1/admin/kdts/${datasetId}`,
        UPDATE_HISTORY: (historyId: string) => `/v1/admin/kdts/${historyId}`,
      },
    },

    // Users (Stage 5)
    USERS: {
      LIST: '/v1/admin/users',
      DETAIL: (userId: string) => `/v1/admin/users/${userId}`,
      SUSPEND: (userId: string) => `/v1/admin/users/${userId}/suspend`,
      UNSUSPEND: (userId: string) => `/v1/admin/users/${userId}/unsuspend`,
      DELETE: (userId: string) => `/v1/admin/users/${userId}`,
    },

    // Admins (Stage 6)
    ADMINS: {
      LIST: '/v1/admin/admins',
      DETAIL: (adminId: string) => `/v1/admin/admins/${adminId}`,
      UPDATE: (adminId: string) => `/v1/admin/admins/${adminId}`,
      DELETE: (adminId: string) => `/v1/admin/admins/${adminId}`,
      ROLES: {
        LIST: (adminId: string) => `/v1/admin/admins/${adminId}/roles`,
        UPDATE: (adminId: string) => `/v1/admin/admins/${adminId}/roles`,
      },
    },

    // Admin Invites (delegated invite management)
    ADMIN_INVITES: {
      LIST: '/v1/admin/admin-invites',
      DETAIL: (inviteId: string) => `/v1/admin/admin-invites/${inviteId}`,
      CREATE: '/v1/admin/admin-invites',
      RESEND: (inviteId: string) => `/v1/admin/admin-invites/${inviteId}/resend`,
      CANCEL: (inviteId: string) => `/v1/admin/admin-invites/${inviteId}/cancel`,
    },

    // Supplier Invites
    SUPPLIER_INVITES: {
      LIST: '/v1/admin/supplier-invites',
      CREATE: '/v1/admin/supplier-invites',
      DETAIL: (inviteId: string) => `/v1/admin/supplier-invites/${inviteId}`,
      RESEND: (inviteId: string) => `/v1/admin/supplier-invites/${inviteId}/resend`,
    },

    // Suppliers
    SUPPLIERS: {
      LIST: '/v1/admin/suppliers',
      DETAIL: (supplierId: string) => `/v1/admin/suppliers/${supplierId}`,
      ANALYTICS: (supplierId: string) => `/v1/admin/suppliers/${supplierId}/analytics`,
      KYC: (supplierId: string) => `/v1/admin/suppliers/${supplierId}/kyc`,
      KYC_QUEUE: '/v1/admin/suppliers/kyc/queue',
      KYC_PICK: (supplierId: string) => `/v1/admin/suppliers/kyc/${supplierId}/pick`,
      KYC_VERIFY: (supplierId: string) => `/v1/admin/suppliers/kyc/${supplierId}/verify`,
      KYC_REJECT: (supplierId: string) => `/v1/admin/suppliers/kyc/${supplierId}/reject`,
      MARK_OFFLINE_CONTRACT_DONE: (supplierId: string) =>
        `/v1/admin/suppliers/${supplierId}/offline-contract/mark-done`,
    },

    // Roles (read-only)
    ROLES: {
      LIST: '/v1/admin/roles',
      DETAIL: (roleId: string) => `/v1/admin/roles/${roleId}`,
    },

    // Reports
    REPORTS: {
      RUN_DAILY_DATASET: '/v1/admin/reports/daily-dataset/run',
    },
  },

  // ============================================
  // SUPERADMIN ROUTES (/api/v1/superadmin)
  // ============================================
  SUPERADMIN: {
    // Roles
    ROLES: {
      LIST: '/v1/superadmin/roles',
      DETAIL: (roleId: string) => `/v1/superadmin/roles/${roleId}`,
      CREATE: '/v1/superadmin/roles',
      UPDATE: (roleId: string) => `/v1/superadmin/roles/${roleId}`,

      // Role Permissions
      PERMISSIONS: {
        LIST: (roleId: string) => `/v1/superadmin/roles/${roleId}/permissions`,
        PUT: (roleId: string) => `/v1/superadmin/roles/${roleId}/permissions`,
        REPLACE: (roleId: string) => `/v1/superadmin/roles/${roleId}/permissions/replace`,
        ADD: (roleId: string) => `/v1/superadmin/roles/${roleId}/permissions/add`,
        REMOVE: (roleId: string) => `/v1/superadmin/roles/${roleId}/permissions/remove`,
      },
    },

    // Audit Logs
    AUDIT: {
      INVITES: '/v1/superadmin/audit/invites',
      ADMIN_ROLES: '/v1/superadmin/audit/admin-roles',
      ROLE_PERMISSIONS: '/v1/superadmin/audit/role-permissions',
    },
  },
} as const;
