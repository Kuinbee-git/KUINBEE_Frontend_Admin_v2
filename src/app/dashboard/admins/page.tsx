'use client';

import { useRouter } from 'next/navigation';
import { AdminsListView } from '@/components/admins/AdminsListView';

export default function AdminsPage() {
  const router = useRouter();
  const handleAdminClick = (adminId: string) => {
    router.push(`/dashboard/admins/${adminId}`);
  };

  return <AdminsListView onAdminClick={handleAdminClick} />;
}
