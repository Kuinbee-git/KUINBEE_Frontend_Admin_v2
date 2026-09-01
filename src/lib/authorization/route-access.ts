import type { AccessRequirement } from './authorization';
import { PERMISSIONS } from '@/lib/constants/permissions';

type RouteAccessRule = {
  matches: (pathname: string) => boolean;
  requirement: AccessRequirement;
};

const startsWith = (prefix: string) => (pathname: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export const ADMIN_DIRECTORY_ACCESS: AccessRequirement = {
  anyOf: [
    PERMISSIONS.ROLES.MANAGE,
    PERMISSIONS.ROLES.ASSIGN,
    PERMISSIONS.ADMINS.UPDATE,
    PERMISSIONS.ADMINS.DELETE,
  ],
};

export const CATEGORY_CATALOG_ACCESS: AccessRequirement = {
  anyOf: [
    PERMISSIONS.CATEGORIES.VIEW,
    PERMISSIONS.CATEGORIES.CREATE,
    PERMISSIONS.CATEGORIES.UPDATE,
    PERMISSIONS.CATEGORIES.DELETE,
  ],
};

export const SOURCE_CATALOG_ACCESS: AccessRequirement = {
  anyOf: [
    PERMISSIONS.SOURCES.VIEW,
    PERMISSIONS.SOURCES.CREATE,
    PERMISSIONS.SOURCES.UPDATE,
    PERMISSIONS.SOURCES.DELETE,
  ],
};

export const PLATFORM_DATASET_ACCESS: AccessRequirement = {
  anyOf: [
    PERMISSIONS.DATASETS.VIEW_PLATFORM,
    PERMISSIONS.DATASETS.CREATE_PLATFORM,
    PERMISSIONS.DATASETS.UPDATE_PLATFORM,
    PERMISSIONS.DATASETS.DELETE_PLATFORM,
    PERMISSIONS.DATASETS.PUBLISH_PLATFORM,
    PERMISSIONS.DATASETS.EDIT_METADATA,
    PERMISSIONS.DATASETS.UNPUBLISH,
  ],
};

const DATASET_REVIEW_PERMISSIONS = [
  PERMISSIONS.DATASETS.VIEW_PROPOSALS,
  PERMISSIONS.DATASETS.APPROVE,
  PERMISSIONS.DATASETS.REJECT,
  PERMISSIONS.DATASETS.REQUEST_CHANGES,
] as const;

export const DATASET_REVIEW_ACCESS: AccessRequirement = {
  anyOf: DATASET_REVIEW_PERMISSIONS,
};

const DATASET_REVIEW_DETAIL_ACCESS: AccessRequirement = {
  anyOf: [...DATASET_REVIEW_PERMISSIONS, PERMISSIONS.DATASETS.VIEW_ASSIGNED],
};

export const USER_DIRECTORY_ACCESS: AccessRequirement = {
  anyOf: [
    PERMISSIONS.USERS.VIEW,
    PERMISSIONS.USERS.MANAGE,
    PERMISSIONS.USERS.SUSPEND,
    PERMISSIONS.USERS.DELETE,
  ],
};

const SUPPLIER_DIRECTORY_ACCESS: AccessRequirement = {
  anyOf: [PERMISSIONS.SUPPLIERS.VIEW, PERMISSIONS.SUPPLIERS.MANAGE_VERIFICATION],
};

export const SUPPLIER_WORKSPACE_ACCESS: AccessRequirement = {
  anyOf: [
    PERMISSIONS.SUPPLIERS.VIEW,
    PERMISSIONS.SUPPLIERS.INVITE,
    PERMISSIONS.SUPPLIERS.MANAGE_VERIFICATION,
  ],
};

export const DATA_REQUIREMENT_ACCESS: AccessRequirement = {
  anyOf: [
    PERMISSIONS.DATA_REQUIREMENTS.VIEW,
    PERMISSIONS.DATA_REQUIREMENTS.MANAGE,
    PERMISSIONS.DATA_REQUIREMENTS.PUBLISH,
  ],
};

const ROUTE_ACCESS_RULES: readonly RouteAccessRule[] = [
  {
    matches: (pathname) => /^\/dashboard\/suppliers\/[^/]+\/analytics(?:\/|$)/.test(pathname),
    requirement: {
      allOf: [PERMISSIONS.SUPPLIERS.VIEW, PERMISSIONS.SUPPLIERS.VIEW_ANALYTICS],
    },
  },
  {
    matches: startsWith('/dashboard/datasets/new'),
    requirement: { anyOf: [PERMISSIONS.DATASETS.CREATE_PLATFORM] },
  },
  {
    matches: (pathname) => /^\/dashboard\/datasets\/[^/]+(?:\/|$)/.test(pathname),
    requirement: DATASET_REVIEW_DETAIL_ACCESS,
  },
  {
    matches: startsWith('/dashboard/admins'),
    requirement: ADMIN_DIRECTORY_ACCESS,
  },
  {
    matches: startsWith('/dashboard/audit'),
    requirement: { superadminOnly: true },
  },
  {
    matches: startsWith('/dashboard/categories'),
    requirement: CATEGORY_CATALOG_ACCESS,
  },
  {
    matches: startsWith('/dashboard/custom-collection-leads'),
    requirement: { anyOf: [PERMISSIONS.CUSTOM_COLLECTION.MANAGE_LEADS] },
  },
  {
    matches: startsWith('/dashboard/custom-collection-services'),
    requirement: { anyOf: [PERMISSIONS.CUSTOM_COLLECTION.REVIEW_SERVICES] },
  },
  {
    matches: startsWith('/dashboard/data-requirements'),
    requirement: DATA_REQUIREMENT_ACCESS,
  },
  {
    matches: startsWith('/dashboard/platform-datasets'),
    requirement: PLATFORM_DATASET_ACCESS,
  },
  {
    matches: startsWith('/dashboard/datasets'),
    requirement: PLATFORM_DATASET_ACCESS,
  },
  {
    matches: startsWith('/dashboard/discount-proposals'),
    requirement: DATASET_REVIEW_ACCESS,
  },
  {
    matches: startsWith('/dashboard/invites'),
    requirement: { anyOf: [PERMISSIONS.ADMINS.CREATE] },
  },
  {
    matches: startsWith('/dashboard/my-queue'),
    requirement: { anyOf: [PERMISSIONS.DATASETS.VIEW_ASSIGNED] },
  },
  {
    matches: startsWith('/dashboard/proposals'),
    requirement: DATASET_REVIEW_ACCESS,
  },
  {
    matches: startsWith('/dashboard/questions'),
    requirement: { anyOf: [PERMISSIONS.DATASETS.VIEW_PROPOSALS] },
  },
  {
    matches: startsWith('/dashboard/reviews'),
    requirement: { anyOf: [PERMISSIONS.DATASETS.VIEW_ANALYTICS] },
  },
  {
    matches: startsWith('/dashboard/reports'),
    requirement: { anyOf: [PERMISSIONS.REPORTS.VIEW, PERMISSIONS.REPORTS.EXPORT] },
  },
  {
    matches: startsWith('/dashboard/roles'),
    requirement: { anyOf: [PERMISSIONS.ROLES.MANAGE] },
  },
  {
    matches: startsWith('/dashboard/sources'),
    requirement: SOURCE_CATALOG_ACCESS,
  },
  {
    matches: startsWith('/dashboard/supplier-kyc'),
    requirement: { anyOf: [PERMISSIONS.SUPPLIERS.MANAGE_VERIFICATION] },
  },
  {
    matches: (pathname) => /^\/dashboard\/suppliers\/[^/]+(?:\/|$)/.test(pathname),
    requirement: SUPPLIER_DIRECTORY_ACCESS,
  },
  {
    matches: startsWith('/dashboard/suppliers'),
    requirement: SUPPLIER_WORKSPACE_ACCESS,
  },
  {
    matches: startsWith('/dashboard/update-requests'),
    requirement: DATASET_REVIEW_ACCESS,
  },
  {
    matches: startsWith('/dashboard/users'),
    requirement: USER_DIRECTORY_ACCESS,
  },
];

export const getRouteAccessRequirement = (pathname: string): AccessRequirement | undefined =>
  ROUTE_ACCESS_RULES.find((rule) => rule.matches(pathname))?.requirement;
