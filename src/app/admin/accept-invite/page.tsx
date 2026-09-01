'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthCard } from '@/components/auth/AuthCard';
import { AcceptInviteForm } from '@/components/auth/AcceptInviteForm';
import { Button } from '@/components/ui/button';

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  // Missing token
  if (!token) {
    return (
      <AuthLayout>
        <AuthHeader title="Invalid Invitation" description="No invitation token found" />
        <AuthCard>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--status-warning-bg)]">
              <AlertTriangle className="h-8 w-8 text-[var(--status-warning)]" />
            </div>

            <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
              Invalid Invitation Link
            </h3>

            <p className="mb-6 text-sm text-[var(--text-muted)]">
              The invitation link appears to be incomplete or invalid.
              <br />
              Please check your email for the correct link or contact support.
            </p>

            <Button onClick={() => router.push('/login')} variant="outline" className="h-11">
              Go to Login
            </Button>
          </motion.div>
        </AuthCard>
      </AuthLayout>
    );
  }

  // Valid token - show form
  return (
    <AuthLayout>
      <AuthHeader
        title="Accept Invitation"
        description="Set your password to activate your admin account"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--status-success-border)] bg-[var(--status-success-bg)] px-4 py-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--status-success-bg)]">
          <ShieldCheck className="h-5 w-5 text-[var(--status-success)]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--status-success)]">Valid Invitation</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Create a secure password to get started
          </p>
        </div>
      </motion.div>

      <AuthCard
        title="Create Your Account"
        description="Choose a strong password for your admin account"
      >
        <AcceptInviteForm token={token} />
      </AuthCard>
    </AuthLayout>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <AuthHeader title="Accept Invitation" description="Loading..." />
          <AuthCard>
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--action-primary)]" />
            </div>
          </AuthCard>
        </AuthLayout>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
