import { useMemo } from 'react';
import { useProfile, useMyPermissions, useCurrentUser } from './useAuth';
import { useAuthStore } from '@/store/auth.store';

export function useProfileData() {
  const { isAuthenticated } = useAuthStore();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile({ 
    enabled: isAuthenticated 
  });
  const { data: permissions, isLoading: permissionsLoading } = useMyPermissions({ 
    enabled: isAuthenticated 
  });

  const isLoading = userLoading || profileLoading || permissionsLoading;
  const userPermissions = useMemo(() => permissions || [], [permissions]);

  const fullName = useMemo(() => {
    const firstName = profile?.personalInfo?.firstName || '';
    const lastName = profile?.personalInfo?.lastName || '';
    return firstName && lastName ? `${firstName} ${lastName}` : user?.email?.split('@')[0] || 'Admin';
  }, [profile, user]);

  const inferredRole = useMemo(() => {
    if (!userPermissions.length) return 'Admin';
    
    const hasDatasetPerms = userPermissions.some((p: string) => p.startsWith('datasets:'));
    const hasCatalogPerms = userPermissions.some((p: string) => p.startsWith('categories:') || p.startsWith('sources:'));
    const hasAdminPerms = userPermissions.some((p: string) => p.startsWith('admins:'));
    
    const roles: string[] = [];
    if (hasDatasetPerms) roles.push('Dataset Reviewer');
    if (hasCatalogPerms) roles.push('Catalog Manager');
    if (hasAdminPerms) roles.push('Admin Manager');
    
    return roles.length > 0 ? roles.join(' & ') : 'Admin';
  }, [userPermissions]);

  return {
    profile,
    user,
    userPermissions,
    fullName,
    inferredRole,
    isLoading,
    error: profileError,
  };
}
