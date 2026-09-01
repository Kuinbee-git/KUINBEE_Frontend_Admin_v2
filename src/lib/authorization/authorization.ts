import type { UserType } from '@/types/auth.types';
import type { Permission } from '@/lib/constants/permissions';

export type AccessRequirement = {
  anyOf?: readonly Permission[];
  allOf?: readonly Permission[];
  superadminOnly?: boolean;
};

export const canAccess = (
  userType: UserType | undefined,
  permissions: readonly string[],
  requirement?: AccessRequirement
): boolean => {
  if (!userType || (userType !== 'ADMIN' && userType !== 'SUPERADMIN')) return false;
  if (!requirement) return true;
  if (userType === 'SUPERADMIN') return true;
  if (requirement.superadminOnly) return false;

  const granted = new Set(permissions);
  if (requirement.allOf?.some((permission) => !granted.has(permission))) return false;
  if (requirement.anyOf && !requirement.anyOf.some((permission) => granted.has(permission))) {
    return false;
  }
  return true;
};
