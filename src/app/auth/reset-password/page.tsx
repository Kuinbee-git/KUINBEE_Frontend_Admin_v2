'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';

import { AuthCard } from '@/components/auth/AuthCard';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { Button } from '@/components/ui/button';
import { useConfirmAdminPasswordReset } from '@/hooks';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email')?.trim().toLowerCase() ?? '';
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const mutation = useConfirmAdminPasswordReset();

  const validationMessage = useMemo(() => {
    if (password && password.length < 8) return 'Password must be at least 8 characters.';
    if (confirmation && password !== confirmation) return 'Passwords do not match.';
    return null;
  }, [confirmation, password]);

  const canSubmit = password.length >= 8 && password === confirmation && !mutation.isPending;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      await mutation.mutateAsync({ email, token, newPassword: password });
    } catch {
      // The mutation error is rendered below the fields.
    }
  };

  if (!email || !token) {
    return (
      <AuthLayout>
        <AuthHeader title="Invalid reset link" description="The recovery link is incomplete" />
        <AuthCard>
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--status-warning-bg)]">
              <AlertTriangle className="h-6 w-6 text-[var(--status-warning)]" aria-hidden="true" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Request a new password reset email and use the complete link it contains.
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/forgot-password">Request a new link</Link>
            </Button>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHeader title="Choose a new password" description={`Resetting access for ${email}`} />
      <AuthCard title={mutation.isSuccess ? 'Password updated' : 'Secure your account'}>
        {mutation.isSuccess ? (
          <div className="space-y-6 text-center" aria-live="polite">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--status-success-bg)]">
              <CheckCircle2 className="h-6 w-6 text-[var(--status-success)]" aria-hidden="true" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Your password has been changed. The reset link cannot be used again.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <PasswordInput
              id="new-password"
              label="New password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              disabled={mutation.isPending}
              required
            />
            <PasswordInput
              id="confirm-new-password"
              label="Confirm new password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="new-password"
              disabled={mutation.isPending}
              required
            />

            {validationMessage ? (
              <p className="text-sm text-[var(--status-error)]" role="alert">
                {validationMessage}
              </p>
            ) : null}
            {mutation.isError ? (
              <p className="text-sm text-[var(--status-error)]" role="alert">
                {getFriendlyErrorMessage(mutation.error)}
              </p>
            ) : null}

            <Button type="submit" className="glass-button h-12 w-full" disabled={!canSubmit}>
              {mutation.isPending ? 'Updating password…' : 'Update password'}
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to sign in
              </Link>
            </Button>
          </form>
        )}
      </AuthCard>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <AuthHeader title="Reset password" description="Loading secure recovery…" />
        </AuthLayout>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
