'use client';

import { useCallback, useMemo } from 'react';
import { useMyPermissions } from '@/hooks/api/useAuth';
import { canAccess, type AccessRequirement } from '@/lib/authorization/authorization';
import { useAuthStore } from '@/store/auth.store';

export function useAuthorization() {
  const user = useAuthStore((state) => state.user);
  const storedPermissions = useAuthStore((state) => state.permissions);
  const permissionsQuery = useMyPermissions({ enabled: Boolean(user) });
  const permissions = useMemo(
    () => (permissionsQuery.isError ? [] : (permissionsQuery.data ?? storedPermissions)),
    [permissionsQuery.data, permissionsQuery.isError, storedPermissions]
  );

  const can = useCallback(
    (requirement?: AccessRequirement) => canAccess(user?.userType, permissions, requirement),
    [permissions, user?.userType]
  );

  return {
    can,
    isSuperadmin: user?.userType === 'SUPERADMIN',
    permissions,
    permissionsQuery,
    user,
  };
}
