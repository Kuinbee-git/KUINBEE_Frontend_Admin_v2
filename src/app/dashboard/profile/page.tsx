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
  SecurityCard,
} from '@/components/profile';

export default function ProfilePage() {
  const { profile, user, userPermissions, fullName, inferredRole, isLoading, error, retry } =
    useProfileData();

  if (isLoading) return <ProfileSkeleton />;
  if (error) return <ErrorFallback onRetry={retry} />;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <ProfileHeader
        fullName={fullName}
        email={user?.email || ''}
        currentUser={user}
        inferredRole={inferredRole}
      />

      <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <PersonalInfoCard profile={profile} />
          <OrganizationalDetailsCard profile={profile} />
          <SecurityCard />
          <AddressesCard />
        </div>

        <div className="lg:col-span-1">
          <PermissionsCard permissions={userPermissions} />
        </div>
      </div>
    </div>
  );
}
