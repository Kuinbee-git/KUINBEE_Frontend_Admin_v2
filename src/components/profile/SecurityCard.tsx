'use client';

import { useMemo, useState } from 'react';
import { KeyRound } from 'lucide-react';

import { PasswordInput } from '@/components/shared/PasswordInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useChangeAdminPassword } from '@/hooks';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';

export function SecurityCard() {
  const [isEditing, setEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const mutation = useChangeAdminPassword();

  const validationMessage = useMemo(() => {
    if (newPassword && newPassword.length < 8) {
      return 'New password must be at least 8 characters.';
    }
    if (confirmation && newPassword !== confirmation) {
      return 'New passwords do not match.';
    }
    if (currentPassword && newPassword && currentPassword === newPassword) {
      return 'Choose a new password that differs from your current password.';
    }
    return null;
  }, [confirmation, currentPassword, newPassword]);

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmation('');
    mutation.reset();
  };

  const handleCancel = () => {
    reset();
    setEditing(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !currentPassword ||
      newPassword.length < 8 ||
      newPassword !== confirmation ||
      validationMessage
    ) {
      return;
    }

    try {
      await mutation.mutateAsync({ currentPassword, newPassword });
      reset();
      setEditing(false);
    } catch {
      // The hook reports the error through a toast and the inline message below.
    }
  };

  return (
    <Card style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}>
      <CardContent className="p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[var(--brand-primary-bg)] p-2">
              <KeyRound className="h-4 w-4 text-[var(--nav-active)]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">Password & security</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Update the password used to access this admin account.
              </p>
            </div>
          </div>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Change
            </Button>
          ) : null}
        </div>

        {isEditing ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <PasswordInput
              id="current-password"
              label="Current password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              disabled={mutation.isPending}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <PasswordInput
                id="profile-new-password"
                label="New password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                disabled={mutation.isPending}
                required
              />
              <PasswordInput
                id="profile-confirm-password"
                label="Confirm new password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
                disabled={mutation.isPending}
                required
              />
            </div>

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

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={Boolean(validationMessage) || mutation.isPending}>
                {mutation.isPending ? 'Changing password…' : 'Change password'}
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
