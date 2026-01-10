'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to audit page since reports are not implemented yet
    router.push('/dashboard/audit');
  }, [router]);

  return (
    <div className="p-6 flex items-center justify-center min-h-screen">
      <p style={{ color: 'var(--text-muted)' }}>Redirecting to Audit Logs...</p>
    </div>
  );
}
