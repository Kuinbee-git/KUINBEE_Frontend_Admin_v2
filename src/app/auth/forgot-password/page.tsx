'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';

import { AuthCard } from '@/components/auth/AuthCard';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRequestAdminPasswordReset } from '@/hooks';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const mutation = useRequestAdminPasswordReset();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await mutation.mutateAsync({ email: email.trim().toLowerCase() });
      setSubmitted(true);
    } catch {
      // The mutation error is rendered below the field.
    }
  };

  return (
    <AuthLayout>
      <AuthHeader
        title="Recover admin access"
        description="Request a time-limited password reset link"
      />
      <AuthCard title={submitted ? 'Check your inbox' : 'Reset your password'}>
        {submitted ? (
          <div className="space-y-6 text-center" aria-live="polite">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--status-success-bg)]">
              <CheckCircle2 className="h-6 w-6 text-[var(--status-success)]" aria-hidden="true" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              If an active administrator account exists for <strong>{email}</strong>, a reset link
              has been sent. The link expires in 30 minutes.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to sign in
              </Link>
            </Button>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Admin email</Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
                  aria-hidden="true"
                />
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@kuinbee.com"
                  className="glass-input h-12 pl-10"
                  disabled={mutation.isPending}
                  required
                />
              </div>
            </div>

            {mutation.isError ? (
              <p className="text-sm text-[var(--status-error)]" role="alert">
                {getFriendlyErrorMessage(mutation.error)}
              </p>
            ) : null}

            <Button
              type="submit"
              className="glass-button h-12 w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Sending reset link…' : 'Send reset link'}
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
