/**
 * Canonical admin permissions.
 *
 * Keep this list in lockstep with backend/packages/api-contracts/src/common.schema.ts.
 */
const PERMISSION_VALUES = [
  'CREATE_CATEGORY',
  'UPDATE_CATEGORY',
  'DELETE_CATEGORY',
  'VIEW_CATEGORY',
  'CREATE_SOURCE',
  'UPDATE_SOURCE',
  'DELETE_SOURCE',
  'VIEW_SOURCE',
  'CREATE_PLATFORM_DATASET',
  'UPDATE_PLATFORM_DATASET',
  'DELETE_PLATFORM_DATASET',
  'VIEW_PLATFORM_DATASET',
  'PUBLISH_PLATFORM_DATASET',
  'INVITE_SUPPLIER',
  'VIEW_SUPPLIER',
  'VIEW_SUPPLIER_ANALYTICS',
  'VIEW_DATASET_PROPOSALS',
  'APPROVE_DATASET',
  'REJECT_DATASET',
  'REQUEST_DATASET_CHANGES',
  'EDIT_DATASET_METADATA',
  'UNPUBLISH_DATASET',
  'VIEW_ASSIGNED_DATASETS',
  'VIEW_ANALYTICS',
  'VIEW_REPORTS',
  'EXPORT_REPORTS',
  'VIEW_USERS',
  'MANAGE_USERS',
  'SUSPEND_USERS',
  'DELETE_USERS',
  'CREATE_ADMIN',
  'UPDATE_ADMIN',
  'DELETE_ADMIN',
  'ASSIGN_ROLES',
  'MANAGE_SUPPLIER_VERIFICATION',
  'REVIEW_CUSTOM_COLLECTION_SERVICE',
  'MANAGE_CUSTOM_COLLECTION_LEADS',
  'VIEW_DATA_REQUIREMENTS',
  'MANAGE_DATA_REQUIREMENTS',
  'PUBLISH_DATA_REQUIREMENTS',
  'MANAGE_PERMISSIONS',
] as const;

export type Permission = (typeof PERMISSION_VALUES)[number];

const PERMISSION_SET = new Set<string>(PERMISSION_VALUES);

const isPermission = (value: unknown): value is Permission =>
  typeof value === 'string' && PERMISSION_SET.has(value);

export const normalizePermissions = (values: unknown): Permission[] =>
  Array.isArray(values) ? Array.from(new Set(values.filter(isPermission))) : [];

export const PERMISSIONS = {
  CATEGORIES: {
    CREATE: 'CREATE_CATEGORY',
    UPDATE: 'UPDATE_CATEGORY',
    DELETE: 'DELETE_CATEGORY',
    VIEW: 'VIEW_CATEGORY',
  },
  SOURCES: {
    CREATE: 'CREATE_SOURCE',
    UPDATE: 'UPDATE_SOURCE',
    DELETE: 'DELETE_SOURCE',
    VIEW: 'VIEW_SOURCE',
  },
  DATASETS: {
    CREATE_PLATFORM: 'CREATE_PLATFORM_DATASET',
    UPDATE_PLATFORM: 'UPDATE_PLATFORM_DATASET',
    DELETE_PLATFORM: 'DELETE_PLATFORM_DATASET',
    VIEW_PLATFORM: 'VIEW_PLATFORM_DATASET',
    PUBLISH_PLATFORM: 'PUBLISH_PLATFORM_DATASET',
    VIEW_PROPOSALS: 'VIEW_DATASET_PROPOSALS',
    APPROVE: 'APPROVE_DATASET',
    REJECT: 'REJECT_DATASET',
    REQUEST_CHANGES: 'REQUEST_DATASET_CHANGES',
    EDIT_METADATA: 'EDIT_DATASET_METADATA',
    UNPUBLISH: 'UNPUBLISH_DATASET',
    VIEW_ASSIGNED: 'VIEW_ASSIGNED_DATASETS',
    VIEW_ANALYTICS: 'VIEW_ANALYTICS',
  },
  SUPPLIERS: {
    INVITE: 'INVITE_SUPPLIER',
    VIEW: 'VIEW_SUPPLIER',
    VIEW_ANALYTICS: 'VIEW_SUPPLIER_ANALYTICS',
    MANAGE_VERIFICATION: 'MANAGE_SUPPLIER_VERIFICATION',
  },
  USERS: {
    VIEW: 'VIEW_USERS',
    MANAGE: 'MANAGE_USERS',
    SUSPEND: 'SUSPEND_USERS',
    DELETE: 'DELETE_USERS',
  },
  ADMINS: {
    CREATE: 'CREATE_ADMIN',
    UPDATE: 'UPDATE_ADMIN',
    DELETE: 'DELETE_ADMIN',
  },
  ROLES: {
    ASSIGN: 'ASSIGN_ROLES',
    MANAGE: 'MANAGE_PERMISSIONS',
  },
  REPORTS: {
    VIEW: 'VIEW_REPORTS',
    EXPORT: 'EXPORT_REPORTS',
  },
  CUSTOM_COLLECTION: {
    REVIEW_SERVICES: 'REVIEW_CUSTOM_COLLECTION_SERVICE',
    MANAGE_LEADS: 'MANAGE_CUSTOM_COLLECTION_LEADS',
  },
  DATA_REQUIREMENTS: {
    VIEW: 'VIEW_DATA_REQUIREMENTS',
    MANAGE: 'MANAGE_DATA_REQUIREMENTS',
    PUBLISH: 'PUBLISH_DATA_REQUIREMENTS',
  },
} as const satisfies Record<string, Record<string, Permission>>;

export const PERMISSION_LABELS: Record<Permission, string> = {
  CREATE_CATEGORY: 'Create categories',
  UPDATE_CATEGORY: 'Update categories',
  DELETE_CATEGORY: 'Delete categories',
  VIEW_CATEGORY: 'View categories',
  CREATE_SOURCE: 'Create sources',
  UPDATE_SOURCE: 'Update sources',
  DELETE_SOURCE: 'Delete sources',
  VIEW_SOURCE: 'View sources',
  CREATE_PLATFORM_DATASET: 'Create platform datasets',
  UPDATE_PLATFORM_DATASET: 'Update platform datasets',
  DELETE_PLATFORM_DATASET: 'Delete platform datasets',
  VIEW_PLATFORM_DATASET: 'View platform datasets',
  PUBLISH_PLATFORM_DATASET: 'Publish platform datasets',
  INVITE_SUPPLIER: 'Invite suppliers',
  VIEW_SUPPLIER: 'View suppliers',
  VIEW_SUPPLIER_ANALYTICS: 'View supplier analytics',
  VIEW_DATASET_PROPOSALS: 'View dataset proposals',
  APPROVE_DATASET: 'Approve dataset proposals',
  REJECT_DATASET: 'Reject dataset proposals',
  REQUEST_DATASET_CHANGES: 'Request dataset changes',
  EDIT_DATASET_METADATA: 'Edit dataset metadata',
  UNPUBLISH_DATASET: 'Unpublish datasets',
  VIEW_ASSIGNED_DATASETS: 'View assigned datasets',
  VIEW_ANALYTICS: 'View marketplace analytics',
  VIEW_REPORTS: 'View reports',
  EXPORT_REPORTS: 'Run and export reports',
  VIEW_USERS: 'View users',
  MANAGE_USERS: 'Manage users',
  SUSPEND_USERS: 'Suspend users',
  DELETE_USERS: 'Delete users',
  CREATE_ADMIN: 'Create and invite admins',
  UPDATE_ADMIN: 'Update admins',
  DELETE_ADMIN: 'Delete admins',
  ASSIGN_ROLES: 'Assign roles',
  MANAGE_SUPPLIER_VERIFICATION: 'Manage supplier verification',
  REVIEW_CUSTOM_COLLECTION_SERVICE: 'Review custom services',
  MANAGE_CUSTOM_COLLECTION_LEADS: 'Manage custom-service leads',
  VIEW_DATA_REQUIREMENTS: 'View data requirements',
  MANAGE_DATA_REQUIREMENTS: 'Manage data requirements',
  PUBLISH_DATA_REQUIREMENTS: 'Publish data requirements',
  MANAGE_PERMISSIONS: 'Manage roles and permissions',
};

export const PERMISSION_GROUPS = [
  { id: 'categories', label: 'Categories', permissions: Object.values(PERMISSIONS.CATEGORIES) },
  { id: 'sources', label: 'Sources', permissions: Object.values(PERMISSIONS.SOURCES) },
  { id: 'datasets', label: 'Datasets', permissions: Object.values(PERMISSIONS.DATASETS) },
  { id: 'suppliers', label: 'Suppliers', permissions: Object.values(PERMISSIONS.SUPPLIERS) },
  { id: 'users', label: 'Users', permissions: Object.values(PERMISSIONS.USERS) },
  { id: 'admins', label: 'Admins', permissions: Object.values(PERMISSIONS.ADMINS) },
  { id: 'roles', label: 'Roles & permissions', permissions: Object.values(PERMISSIONS.ROLES) },
  { id: 'reports', label: 'Reports', permissions: Object.values(PERMISSIONS.REPORTS) },
  {
    id: 'custom-collection',
    label: 'Custom collection',
    permissions: Object.values(PERMISSIONS.CUSTOM_COLLECTION),
  },
  {
    id: 'data-requirements',
    label: 'Data requirements',
    permissions: Object.values(PERMISSIONS.DATA_REQUIREMENTS),
  },
] as const;
