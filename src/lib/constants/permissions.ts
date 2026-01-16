/**
 * Admin Permissions
 * Matches backend permission format (uppercase with underscores)
 * 37 permissions from /api/v1/enums/permissions
 */

export const PERMISSIONS = {
  // Categories (4 permissions)
  CATEGORIES: {
    CREATE: 'CREATE_CATEGORY',
    UPDATE: 'UPDATE_CATEGORY',
    DELETE: 'DELETE_CATEGORY',
    VIEW: 'VIEW_CATEGORY',
  },

  // Sources (4 permissions)
  SOURCES: {
    CREATE: 'CREATE_SOURCE',
    UPDATE: 'UPDATE_SOURCE',
    DELETE: 'DELETE_SOURCE',
    VIEW: 'VIEW_SOURCE',
  },

  // Datasets (10 permissions)
  DATASETS: {
    CREATE_PLATFORM: 'CREATE_PLATFORM_DATASET',
    UPDATE_PLATFORM: 'UPDATE_PLATFORM_DATASET',
    DELETE_PLATFORM: 'DELETE_PLATFORM_DATASET',
    VIEW_PLATFORM: 'VIEW_PLATFORM_DATASETS',
    APPROVE: 'APPROVE_DATASET',
    REJECT: 'REJECT_DATASET',
    REQUEST_CHANGES: 'REQUEST_DATASET_CHANGES',
    PUBLISH: 'PUBLISH_DATASET',
    UNPUBLISH: 'UNPUBLISH_DATASET',
    VIEW_PROPOSALS: 'VIEW_DATASET_PROPOSALS',
  },

  // Suppliers (8 permissions)
  SUPPLIERS: {
    VIEW_ANALYTICS: 'VIEW_SUPPLIER_ANALYTICS',
    VIEW: 'VIEW_SUPPLIERS',
    INVITE: 'INVITE_SUPPLIER',
    CREATE: 'CREATE_SUPPLIER',
    UPDATE: 'UPDATE_SUPPLIER',
    DELETE: 'DELETE_SUPPLIER',
    VERIFY: 'VERIFY_SUPPLIER',
    SUSPEND: 'SUSPEND_SUPPLIER',
  },

  // Users (5 permissions)
  USERS: {
    VIEW: 'VIEW_USERS',
    VIEW_ANALYTICS: 'VIEW_USER_ANALYTICS',
    UPDATE: 'UPDATE_USER',
    DELETE: 'DELETE_USER',
    SUSPEND: 'SUSPEND_USER',
  },

  // Admins (4 permissions)
  ADMINS: {
    VIEW: 'VIEW_ADMINS',
    CREATE: 'CREATE_ADMIN',
    UPDATE: 'UPDATE_ADMIN',
    DELETE: 'DELETE_ADMIN',
  },

  // Roles (5 permissions)
  ROLES: {
    VIEW: 'VIEW_ROLES',
    CREATE: 'CREATE_ROLE',
    UPDATE: 'UPDATE_ROLE',
    DELETE: 'DELETE_ROLE',
    ASSIGN: 'ASSIGN_ROLES',
  },

  // Audit (2 permissions)
  AUDIT: {
    VIEW: 'VIEW_AUDIT_LOGS',
    EXPORT: 'EXPORT_AUDIT_LOGS',
  },
} as const;

// Flat array of all permissions for iteration
export const ALL_PERMISSIONS = [
  ...Object.values(PERMISSIONS.CATEGORIES),
  ...Object.values(PERMISSIONS.SOURCES),
  ...Object.values(PERMISSIONS.DATASETS),
  ...Object.values(PERMISSIONS.SUPPLIERS),
  ...Object.values(PERMISSIONS.USERS),
  ...Object.values(PERMISSIONS.ADMINS),
  ...Object.values(PERMISSIONS.ROLES),
  ...Object.values(PERMISSIONS.AUDIT),
];

// Permission labels for UI display
export const PERMISSION_LABELS: Record<string, string> = {
  // Categories
  CREATE_CATEGORY: 'Create Category',
  UPDATE_CATEGORY: 'Update Category',
  DELETE_CATEGORY: 'Delete Category',
  VIEW_CATEGORY: 'View Category',

  // Sources
  CREATE_SOURCE: 'Create Source',
  UPDATE_SOURCE: 'Update Source',
  DELETE_SOURCE: 'Delete Source',
  VIEW_SOURCE: 'View Source',

  // Datasets
  CREATE_PLATFORM_DATASET: 'Create Platform Dataset',
  UPDATE_PLATFORM_DATASET: 'Update Platform Dataset',
  DELETE_PLATFORM_DATASET: 'Delete Platform Dataset',
  VIEW_PLATFORM_DATASETS: 'View Platform Datasets',
  APPROVE_DATASET: 'Approve Dataset',
  REJECT_DATASET: 'Reject Dataset',
  REQUEST_DATASET_CHANGES: 'Request Dataset Changes',
  PUBLISH_DATASET: 'Publish Dataset',
  UNPUBLISH_DATASET: 'Unpublish Dataset',
  VIEW_DATASET_PROPOSALS: 'View Dataset Proposals',

  // Suppliers
  VIEW_SUPPLIER_ANALYTICS: 'View Supplier Analytics',
  VIEW_SUPPLIERS: 'View Suppliers',
  INVITE_SUPPLIER: 'Invite Supplier',
  CREATE_SUPPLIER: 'Create Supplier',
  UPDATE_SUPPLIER: 'Update Supplier',
  DELETE_SUPPLIER: 'Delete Supplier',
  VERIFY_SUPPLIER: 'Verify Supplier',
  SUSPEND_SUPPLIER: 'Suspend Supplier',

  // Users
  VIEW_USERS: 'View Users',
  VIEW_USER_ANALYTICS: 'View User Analytics',
  UPDATE_USER: 'Update User',
  DELETE_USER: 'Delete User',
  SUSPEND_USER: 'Suspend User',

  // Admins
  VIEW_ADMINS: 'View Admins',
  CREATE_ADMIN: 'Create Admin',
  UPDATE_ADMIN: 'Update Admin',
  DELETE_ADMIN: 'Delete Admin',

  // Roles
  VIEW_ROLES: 'View Roles',
  CREATE_ROLE: 'Create Role',
  UPDATE_ROLE: 'Update Role',
  DELETE_ROLE: 'Delete Role',
  ASSIGN_ROLES: 'Assign Roles',

  // Audit
  VIEW_AUDIT_LOGS: 'View Audit Logs',
  EXPORT_AUDIT_LOGS: 'Export Audit Logs',
};
