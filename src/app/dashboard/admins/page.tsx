'use client';

import { useState, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';

const UsersAdminsIndex = lazy(() => import('@/components/users/UsersAdminsIndex').then(mod => ({ default: mod.UsersAdminsIndex })));
const UsersListView = lazy(() => import('@/components/users/UsersListView').then(mod => ({ default: mod.UsersListView })));
const AdminsListView = lazy(() => import('@/components/admins/AdminsListView').then(mod => ({ default: mod.AdminsListView })));

type View = 'index' | 'users' | 'admins';

export default function AdminsPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('index');

  const handleNavigateToUsers = () => setView('users');
  const handleNavigateToAdmins = () => setView('admins');
  const handleBack = () => setView('index');
  const handleAdminClick = (adminId: string) => {
    router.push(`/dashboard/admins/${adminId}`);
  };

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-surface)' }}><p style={{ color: 'var(--text-muted)' }}>Loading...</p></div>}>
      {view === 'index' && (
        <UsersAdminsIndex
          onNavigateToUsers={handleNavigateToUsers}
          onNavigateToAdmins={handleNavigateToAdmins}
        />
      )}
      {view === 'users' && (
        <UsersListView />
      )}
      {view === 'admins' && (
        <AdminsListView onAdminClick={handleAdminClick} onBack={handleBack} />
      )}
    </Suspense>
  );
}

