"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useThemeStore } from "@/store/theme.store";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { useAcceptInvite } from "@/hooks";
import type { ApiError } from "@/types";

interface AcceptInviteFormProps {
  token: string;
}

export function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const { theme } = useThemeStore();
  const acceptInviteMutation = useAcceptInvite();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isDark = theme === "dark";

  // Validation
  const passwordError = useMemo(() => {
    if (!password) return null;
    if (password.length < 8) return "Password must be at least 8 characters";
    return null;
  }, [password]);

  const confirmPasswordError = useMemo(() => {
    if (!confirmPassword) return null;
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  }, [password, confirmPassword]);

  const isValid = password && confirmPassword && !passwordError && !confirmPasswordError;

  // Get user-friendly error message
  const errorMessage = useMemo(() => {
    if (!acceptInviteMutation.error) return null;

    const error = acceptInviteMutation.error as unknown as ApiError;

    // Handle specific error codes
    if (error.code === 'NETWORK_ERROR') {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    if (error.code === 'INVALID_INVITE_TOKEN') {
      return 'Invalid or expired invitation link. Please request a new invitation.';
    }

    if (error.code === 'INVITE_ALREADY_USED') {
      return 'This invitation has already been used. Please try logging in instead.';
    }

    if (error.code === 'INVITE_CANCELLED') {
      return 'This invitation has been cancelled. Please contact support for assistance.';
    }

    if (error.code === 'INVITE_EXPIRED') {
      return 'This invitation has expired. Please request a new invitation.';
    }

    if (error.code === 'EMAIL_ALREADY_IN_USE') {
      return 'This email is already registered. Please try logging in instead.';
    }

    // Handle specific HTTP status codes
    if (error.statusCode === 400) {
      return 'Invalid request. Please check your password and try again.';
    }

    if (error.statusCode === 404) {
      return 'Invitation not found. Please check your link or request a new invitation.';
    }

    if (error.statusCode === 409) {
      return 'This invitation cannot be accepted. It may have already been used or cancelled.';
    }

    if (error.statusCode === 410) {
      return 'This invitation has expired or been cancelled. Please request a new invitation.';
    }

    if (error.statusCode === 500) {
      return 'Server error. Please try again later or contact support.';
    }

    if (error.statusCode === 503) {
      return 'Service temporarily unavailable. Please try again in a few moments.';
    }

    // Return the error message from backend if available
    if (error.message && error.message !== 'Error') {
      return error.message;
    }

    // Fallback message
    return 'Failed to accept invitation. Please try again or contact support.';
  }, [acceptInviteMutation.error]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!isValid) return;
      
      acceptInviteMutation.mutate({ token, password });
    },
    [token, password, isValid, acceptInviteMutation]
  );

  return (
    <>
      <AnimatePresence mode="wait">
        {acceptInviteMutation.isError && errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Alert
              variant="destructive"
              className={`mb-6 border-[#ef4444]/30 ${
                isDark ? "bg-[#ef4444]/10 backdrop-blur-sm" : "bg-[#fef2f2]"
              }`}
            >
              <AlertCircle className="h-4 w-4 text-[#ef4444]" />
              <AlertDescription className="text-[#ef4444]">
                {errorMessage}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accept Invite Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Password Field */}
        <div>
          <PasswordInput
            id="password"
            label="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={acceptInviteMutation.isPending}
            isDark={isDark}
            required
            placeholder="Min. 8 characters"
          />
          {passwordError && (
            <p className="text-xs text-[#ef4444] mt-1.5">
              {passwordError}
            </p>
          )}
          {password && !passwordError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 mt-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <p className="text-xs text-emerald-500">Password meets requirements</p>
            </motion.div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <PasswordInput
            id="confirmPassword"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={acceptInviteMutation.isPending}
            isDark={isDark}
            required
            placeholder="Re-enter password"
          />
          {confirmPasswordError && (
            <p className="text-xs text-[#ef4444] mt-1.5">
              {confirmPasswordError}
            </p>
          )}
          {confirmPassword && !confirmPasswordError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 mt-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <p className="text-xs text-emerald-500">Passwords match</p>
            </motion.div>
          )}
        </div>

        <Button
          type="submit"
          disabled={acceptInviteMutation.isPending || !isValid}
          className="w-full h-12 text-white font-semibold disabled:opacity-50 mt-8 glass-button glass-shadow-hover border"
          style={{
            background: "linear-gradient(135deg, #1a2240 0%, #2a3250 100%)",
          }}
        >
          {acceptInviteMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Activating account...</span>
            </div>
          ) : (
            "Accept Invitation & Continue"
          )}
        </Button>
      </form>

      {/* Helper Text */}
      <div className="mt-6 text-center">
        <p className={`text-xs ${isDark ? "text-white/50" : "text-[#8b93a5]"}`}>
          By accepting this invitation, you agree to join as an admin user.
        </p>
      </div>
    </>
  );
}
