'use client';

import { Suspense, lazy } from 'react';

const UsersListView = lazy(() => import('@/components/users/UsersListView').then(mod => ({ default: mod.UsersListView })));

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-surface)' }}><p style={{ color: 'var(--text-muted)' }}>Loading...</p></div>}>
      <UsersListView />
    </Suspense>
  );
}

