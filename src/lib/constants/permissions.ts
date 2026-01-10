/**
 * Admin Permissions
 * 31 permissions across 6 domains (from documentation)
 */

export const PERMISSIONS = {
  // Datasets (6 permissions)
  DATASETS: {
    VIEW: 'datasets.view',
    APPROVE: 'datasets.approve',
    REJECT: 'datasets.reject',
    EDIT: 'datasets.edit',
    DELETE: 'datasets.delete',
    QUALITY_CHECK: 'datasets.quality',
  },

  // Suppliers (5 permissions)
  SUPPLIERS: {
    VIEW: 'suppliers.view',
    VERIFY: 'suppliers.verify',
    EDIT: 'suppliers.edit',
    SUSPEND: 'suppliers.suspend',
    DELETE: 'suppliers.delete',
  },

  // Users (5 permissions)
  USERS: {
    VIEW: 'users.view',
    EDIT: 'users.edit',
    SUSPEND: 'users.suspend',
    DELETE: 'users.delete',
    VIEW_ACTIVITY: 'users.activity',
  },

  // Categories (5 permissions)
  CATEGORIES: {
    VIEW: 'categories.view',
    CREATE: 'categories.create',
    EDIT: 'categories.edit',
    MERGE: 'categories.merge',
    DELETE: 'categories.delete',
  },

  // Sources (5 permissions)
  SOURCES: {
    VIEW: 'sources.view',
    CREATE: 'sources.create',
    EDIT: 'sources.edit',
    ARCHIVE: 'sources.archive',
    DELETE: 'sources.delete',
  },

  // Admins (5 permissions)
  ADMINS: {
    VIEW: 'admins.view',
    CREATE: 'admins.create',
    EDIT_PERMISSIONS: 'admins.edit',
    SUSPEND: 'admins.suspend',
    DELETE: 'admins.delete',
  },
} as const;

// Flat array of all permissions for iteration
export const ALL_PERMISSIONS = [
  ...Object.values(PERMISSIONS.DATASETS),
  ...Object.values(PERMISSIONS.SUPPLIERS),
  ...Object.values(PERMISSIONS.USERS),
  ...Object.values(PERMISSIONS.CATEGORIES),
  ...Object.values(PERMISSIONS.SOURCES),
  ...Object.values(PERMISSIONS.ADMINS),
];

// Permission labels for UI display
export const PERMISSION_LABELS: Record<string, string> = {
  // Datasets
  'datasets.view': 'View Datasets',
  'datasets.approve': 'Approve Datasets',
  'datasets.reject': 'Reject Datasets',
  'datasets.edit': 'Edit Datasets',
  'datasets.delete': 'Delete Datasets',
  'datasets.quality': 'Quality Check Datasets',

  // Suppliers
  'suppliers.view': 'View Suppliers',
  'suppliers.verify': 'Verify Suppliers',
  'suppliers.edit': 'Edit Suppliers',
  'suppliers.suspend': 'Suspend Suppliers',
  'suppliers.delete': 'Delete Suppliers',

  // Users
  'users.view': 'View Users',
  'users.edit': 'Edit Users',
  'users.suspend': 'Suspend Users',
  'users.delete': 'Delete Users',
  'users.activity': 'View User Activity',

  // Categories
  'categories.view': 'View Categories',
  'categories.create': 'Create Categories',
  'categories.edit': 'Edit Categories',
  'categories.merge': 'Merge Categories',
  'categories.delete': 'Delete Categories',

  // Sources
  'sources.view': 'View Sources',
  'sources.create': 'Create Sources',
  'sources.edit': 'Edit Sources',
  'sources.archive': 'Archive Sources',
  'sources.delete': 'Delete Sources',

  // Admins
  'admins.view': 'View Admins',
  'admins.create': 'Create Admins',
  'admins.edit': 'Edit Admin Permissions',
  'admins.suspend': 'Suspend Admins',
  'admins.delete': 'Delete Admins',
};
