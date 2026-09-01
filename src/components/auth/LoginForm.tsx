'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { useLogin } from '@/hooks';
import type { ApiError } from '@/types';

export function LoginForm() {
  const loginMutation = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Get user-friendly error message
  const errorMessage = useMemo(() => {
    if (!loginMutation.error) return null;

    const apiError = loginMutation.error as unknown as ApiError;

    // Handle specific error codes
    if (apiError.code === 'NETWORK_ERROR') {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    // Handle specific HTTP status codes
    if (apiError.statusCode === 401) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }

    if (apiError.statusCode === 403) {
      return 'Access denied. Your account may not have admin privileges.';
    }

    if (apiError.statusCode === 429) {
      return 'Too many login attempts. Please wait a few minutes and try again.';
    }

    if (apiError.statusCode === 500) {
      return 'Server error. Please try again later or contact support.';
    }

    if (apiError.statusCode === 503) {
      return 'Service temporarily unavailable. Please try again in a few moments.';
    }

    // Return the error message from backend if available
    if (apiError.message && apiError.message !== 'Error') {
      return apiError.message;
    }

    // Fallback message
    return 'Login failed. Please check your credentials and try again.';
  }, [loginMutation.error]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // The useLogin hook already handles navigation, don't duplicate
      loginMutation.mutate({ email, password });
    },
    [email, password, loginMutation]
  );

  return (
    <>
      <AnimatePresence mode="wait">
        {loginMutation.isError && errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Alert
              variant="destructive"
              className="mb-6 border-[var(--status-error-border)] bg-[var(--status-error-bg)]"
            >
              <AlertCircle className="h-4 w-4 text-[var(--status-error)]" />
              <AlertDescription className="text-[var(--status-error)]">
                {errorMessage}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-[var(--text-primary)]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@kuinbee.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loginMutation.isPending}
            required
            autoComplete="username"
            className="glass-input h-12 text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] disabled:bg-[var(--bg-hover)] disabled:text-[var(--text-disabled)]"
            style={{ backdropFilter: 'blur(16px)' }}
          />
        </div>

        {/* Password Field */}
        <PasswordInput
          id="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loginMutation.isPending}
          required
          autoComplete="current-password"
        />

        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="glass-button glass-shadow-hover mt-8 h-12 w-full border font-semibold disabled:opacity-50"
        >
          {loginMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80" />
              Signing in...
            </div>
          ) : (
            'Sign in'
          )}
        </Button>

        {/* Forgot Password Link */}
        <div className="text-center pt-4">
          <Link
            href="/auth/forgot-password"
            aria-disabled={loginMutation.isPending}
            className="text-sm text-[var(--text-muted)] underline-offset-4 transition-colors hover:text-[var(--text-primary)] hover:underline"
          >
            Forgot password
          </Link>
        </div>
      </form>

      {/* Security Notice */}
      <div className="mt-8 border-t border-[var(--border-default)] pt-6">
        <p className="text-center text-xs leading-relaxed text-[var(--text-muted)]">
          Access monitored · Additional verification may be required
        </p>
      </div>
    </>
  );
}
