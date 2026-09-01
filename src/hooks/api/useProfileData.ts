import { useMemo } from 'react';
import { useProfile, useMyPermissions, useCurrentUser } from './useAuth';
import { useAuthStore } from '@/store/auth.store';
import { PERMISSIONS } from '@/lib/constants/permissions';

const DATASET_PERMISSIONS = new Set<string>(Object.values(PERMISSIONS.DATASETS));
const CATALOG_PERMISSIONS = new Set<string>([
  ...Object.values(PERMISSIONS.CATEGORIES),
  ...Object.values(PERMISSIONS.SOURCES),
]);
const ADMIN_PERMISSIONS = new Set<string>([
  ...Object.values(PERMISSIONS.ADMINS),
  ...Object.values(PERMISSIONS.ROLES),
]);

export function useProfileData() {
  const user = useAuthStore((state) => state.user);
  const {
    data: currentUser,
    isLoading: userLoading,
    error: userError,
    refetch: refetchUser,
  } = useCurrentUser();
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useProfile({
    enabled: !!user,
  });
  const {
    data: permissions,
    isLoading: permissionsLoading,
    error: permissionsError,
    refetch: refetchPermissions,
  } = useMyPermissions({
    enabled: !!user,
  });
  const effectiveUser = currentUser ?? user;

  const isLoading = userLoading || profileLoading || permissionsLoading;
  const error = userError || profileError || permissionsError;
  const userPermissions = useMemo(() => permissions || [], [permissions]);

  const fullName = useMemo(() => {
    const firstName = profile?.personalInfo?.firstName || '';
    const lastName = profile?.personalInfo?.lastName || '';
    return firstName && lastName
      ? `${firstName} ${lastName}`
      : effectiveUser?.email?.split('@')[0] || 'Admin';
  }, [effectiveUser, profile]);

  const inferredRole = useMemo(() => {
    if (effectiveUser?.userType === 'SUPERADMIN') return 'Superadmin';
    if (!userPermissions.length) return 'Admin';

    const hasDatasetPerms = userPermissions.some((permission) =>
      DATASET_PERMISSIONS.has(permission)
    );
    const hasCatalogPerms = userPermissions.some((permission) =>
      CATALOG_PERMISSIONS.has(permission)
    );
    const hasAdminPerms = userPermissions.some((permission) => ADMIN_PERMISSIONS.has(permission));

    const roles: string[] = [];
    if (hasDatasetPerms) roles.push('Dataset Reviewer');
    if (hasCatalogPerms) roles.push('Catalog Manager');
    if (hasAdminPerms) roles.push('Admin Manager');

    return roles.length > 0 ? roles.join(' & ') : 'Admin';
  }, [effectiveUser?.userType, userPermissions]);

  const retry = () => {
    void Promise.all([refetchUser(), refetchProfile(), refetchPermissions()]);
  };

  return {
    profile,
    user: effectiveUser,
    userPermissions,
    fullName,
    inferredRole,
    isLoading,
    error,
    retry,
  };
}
