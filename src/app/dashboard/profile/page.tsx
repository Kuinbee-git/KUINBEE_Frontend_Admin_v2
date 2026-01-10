'use client';

import { useProfileData } from '@/hooks/api/useProfileData';
import {
  ProfileHeader,
  PersonalInfoCard,
  OrganizationalDetailsCard,
  AddressesCard,
  PermissionsCard,
  ProfileSkeleton,
  ErrorFallback,
} from '@/components/profile';

export default function ProfilePage() {
  const { profile, user, userPermissions, fullName, inferredRole, isLoading, error } = useProfileData();

  if (isLoading) return <ProfileSkeleton />;
  if (error) return <ErrorFallback />;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <ProfileHeader
        fullName={fullName}
        email={user?.email || ''}
        currentUser={user}
        inferredRole={inferredRole}
      />

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PersonalInfoCard profile={profile} />
          <OrganizationalDetailsCard profile={profile} />
          <AddressesCard />
        </div>

        <div className="lg:col-span-1">
          <PermissionsCard permissions={userPermissions} />
        </div>
      </div>
    </div>
  );
}
