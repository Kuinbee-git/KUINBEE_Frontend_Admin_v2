'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, Calendar, ShieldAlert, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUser, useSuspendUser, useDeleteUser } from '@/hooks';
import { DetailSkeleton } from '@/components/shared';
import { toast } from 'sonner';

interface UserDetailViewProps {
  userId: string;
}

export function UserDetailView({ userId }: UserDetailViewProps) {
  const router = useRouter();
  const { data, isLoading, isError } = useUser(userId);
  const suspendMutation = useSuspendUser();
  const deleteMutation = useDeleteUser();

  const user = data?.user;

  const handleSuspend = () => {
    if (!user) return;

    const action = user.status === 'SUSPENDED' ? 'unsuspend' : 'suspend';
    const confirmMsg = `Are you sure you want to ${action} this user?`;

    if (!confirm(confirmMsg)) return;

    suspendMutation.mutate(
      { userId, data: {} },
      {
        onSuccess: () => {
          toast.success(`User ${action}ed successfully`);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    deleteMutation.mutate(userId, {
      onSuccess: () => {
        toast.success('User deleted successfully');
        router.push('/dashboard/users');
      },
    });
  };

  if (isError) {
    return (
      <div className="p-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-center py-12">
          <p className="text-red-500">Failed to load user details. Please try again.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <DetailSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-center py-12">
          <p style={{ color: 'var(--text-muted)' }}>User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Users
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {user.email}
            </h1>
            <StatusBadge 
              status={user.status} 
              semanticType={
                user.status === 'ACTIVE' ? 'success' : 
                user.status === 'SUSPENDED' ? 'error' : 
                user.status === 'PENDING_VERIFICATION' ? 'pending' : 
                'neutral'
              } 
            />
            {user.emailVerified && (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                Verified
              </Badge>
            )}
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            User ID: {user.id}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSuspend}
            disabled={suspendMutation.isPending}
            className="gap-2"
          >
            <ShieldAlert className="h-4 w-4" />
            {user.status === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <div
        className="border rounded-lg p-6 space-y-4"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Basic Information
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 mt-1" style={{ color: 'var(--text-muted)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Email
              </p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {user.email}
              </p>
            </div>
          </div>
          {user.phone && (
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 mt-1" style={{ color: 'var(--text-muted)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Phone
                </p>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {user.phone}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 mt-1" style={{ color: 'var(--text-muted)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Joined
              </p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 mt-1" style={{ color: 'var(--text-muted)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Last Updated
              </p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {new Date(user.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div
        className="border rounded-lg p-6 space-y-4"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Account Details
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              User Type
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
              {user.userType}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Email Verified
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
              {user.emailVerified ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </div>

      {/* Organization (if exists) */}
      {data?.personalInfo?.firstName && (
        <div
          className="border rounded-lg p-6 space-y-4"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-default)',
          }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Personal Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Name
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                {data.personalInfo.firstName} {data.personalInfo.lastName}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}