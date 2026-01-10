'use client';

import { useRouter, useParams } from 'next/navigation';
import { AdminProfileDetail } from '@/components/admins/AdminProfileDetail';

export default function AdminDetailPage() {
  const router = useRouter();
  const params = useParams();
  const adminId = params.id as string;

  const handleBack = () => {
    router.push('/dashboard/admins');
  };

  return <AdminProfileDetail adminId={adminId} onBack={handleBack} />;
}

