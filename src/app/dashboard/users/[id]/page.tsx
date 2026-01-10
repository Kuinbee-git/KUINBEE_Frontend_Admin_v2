"use client";

import { Suspense, lazy } from 'react';
import { useParams } from "next/navigation";

const UserDetailView = lazy(() => import('@/components/users/UserDetail').then(mod => ({ default: mod.UserDetailView })));

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-surface)' }}><p style={{ color: 'var(--text-muted)' }}>Loading...</p></div>}>
      <UserDetailView userId={userId} />
    </Suspense>
  );
}

