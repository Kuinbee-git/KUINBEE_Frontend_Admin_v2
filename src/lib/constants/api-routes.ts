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
  },

  // ============================================
  // PERMISSIONS (/api/v1/permissions)
  // ============================================
  PERMISSIONS: '/v1/permissions',

  // ============================================
  // ADMIN ROUTES (/api/v1/admin)
  // ============================================
  ADMIN: {
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
      PICK: (datasetId: string) => `/v1/admin/dataset-proposals/${datasetId}/pick`,
      DOWNLOAD_URL: (datasetId: string) =>
        `/v1/admin/dataset-proposals/${datasetId}/current-upload/download-url`,
      APPROVE: (datasetId: string) => `/v1/admin/dataset-proposals/${datasetId}/approve`,
      REJECT: (datasetId: string) => `/v1/admin/dataset-proposals/${datasetId}/reject`,
      REQUEST_CHANGES: (datasetId: string) =>
        `/v1/admin/dataset-proposals/${datasetId}/request-changes`,
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

      // Uploads
      UPLOADS: {
        LIST: (datasetId: string) => `/v1/admin/datasets/${datasetId}/uploads`,
        START: (datasetId: string) => `/v1/admin/datasets/${datasetId}/uploads/start`,
        COMPLETE: (datasetId: string, uploadId: string) =>
          `/v1/admin/datasets/${datasetId}/uploads/${uploadId}/complete`,
        DOWNLOAD_URL: (datasetId: string, uploadId: string) =>
          `/v1/admin/datasets/${datasetId}/uploads/${uploadId}/download-url`,
      },
    },

    // Users (Stage 5)
    USERS: {
      LIST: '/v1/admin/users',
      DETAIL: (userId: string) => `/v1/admin/users/${userId}`,
      SUSPEND: (userId: string) => `/v1/admin/users/${userId}/suspend`,
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
  },

  // ============================================
  // SUPERADMIN ROUTES (/api/v1/superadmin)
  // ============================================
  SUPERADMIN: {
    // Invites
    INVITES: {
      LIST: '/v1/superadmin/invites',
      DETAIL: (inviteId: string) => `/v1/superadmin/invites/${inviteId}`,
      CREATE: '/v1/superadmin/invites',
      RESEND: (inviteId: string) => `/v1/superadmin/invites/${inviteId}/resend`,
      CANCEL: (inviteId: string) => `/v1/superadmin/invites/${inviteId}/cancel`,
    },

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

    // Admin Roles
    ADMIN_ROLES: {
      LIST: (adminId: string) => `/v1/superadmin/admins/${adminId}/roles`,
      UPDATE: (adminId: string) => `/v1/superadmin/admins/${adminId}/roles`,
    },

    // Audit Logs
    AUDIT: {
      INVITES: '/v1/superadmin/audit/invites',
      ADMIN_ROLES: '/v1/superadmin/audit/admin-roles',
      ROLE_PERMISSIONS: '/v1/superadmin/audit/role-permissions',
    },
  },
} as const;

// ============================================
// Query Parameter Types
// ============================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface SortParams {
  sort?: string;
}

// Invites Query
export interface InvitesQueryParams extends PaginationParams, SortParams {
  q?: string;
  status?: 'ACTIVE' | 'USED' | 'CANCELLED' | 'EXPIRED' | 'ALL';
}

// Roles Query
export interface RolesQueryParams extends PaginationParams, SortParams {
  q?: string;
  isActive?: boolean;
}

// Dataset Proposals Query
export interface DatasetProposalsQueryParams extends PaginationParams, SortParams {
  q?: string;
  status?: 'SUBMITTED' | 'UNDER_REVIEW' | 'REJECTED' | 'VERIFIED' | 'PUBLISHED' | 'ARCHIVED' | 'ALL';
  verificationStatus?:
    | 'PENDING'
    | 'SUBMITTED'
    | 'CHANGES_REQUESTED'
    | 'RESUBMITTED'
    | 'UNDER_REVIEW'
    | 'VERIFIED'
    | 'REJECTED'
    | 'ALL';
  assignedTo?: 'ME' | 'ANY' | 'UNASSIGNED';
}

// Assigned Datasets Query
export interface AssignedDatasetsQueryParams extends PaginationParams, SortParams {
  status?: 'ACTIVE' | 'REASSIGNED' | 'COMPLETED' | 'CANCELLED' | 'ALL';
}

// Categories Query
export interface CategoriesQueryParams extends PaginationParams, SortParams {
  q?: string;
}

// Sources Query
export interface SourcesQueryParams extends PaginationParams, SortParams {
  q?: string;
  isVerified?: boolean;
}

// Datasets Query
export interface DatasetsQueryParams extends PaginationParams, SortParams {
  q?: string;
  status?: 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED' | 'ALL';
  visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED' | 'ALL';
  ownerType?: 'PLATFORM' | 'SUPPLIER' | 'ALL';
  primaryCategoryId?: string;
  sourceId?: string;
  isPaid?: boolean;
}

// Dataset Uploads Query
export interface DatasetUploadsQueryParams extends PaginationParams {
  scope?: 'FINAL' | 'VERIFICATION' | 'ALL';
  status?: 'UPLOADING' | 'UPLOADED' | 'FAILED' | 'PROMOTED' | 'ALL';
}

// Users Query
export interface UsersQueryParams extends PaginationParams, SortParams {
  q?: string;
  userType?: 'USER' | 'SUPPLIER' | 'ADMIN' | 'SUPERADMIN' | 'ALL';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DELETED' | 'ALL';
  emailVerified?: boolean;
}

// Audit Query
export interface AuditQueryParams extends PaginationParams, SortParams {
  from?: string;
  to?: string;
  actorId?: string;
}

export interface InviteAuditQueryParams extends AuditQueryParams {
  inviteId?: string;
  eventType?: 'CREATED' | 'RESENT' | 'CANCELLED' | 'USED';
}

export interface AdminRolesAuditQueryParams extends AuditQueryParams {
  adminId?: string;
  roleId?: string;
  eventType?: 'ASSIGNED' | 'REVOKED';
}

export interface RolePermissionsAuditQueryParams extends AuditQueryParams {
  roleId?: string;
  permission?: string;
  eventType?: 'ADDED' | 'REMOVED' | 'REPLACED';
}
