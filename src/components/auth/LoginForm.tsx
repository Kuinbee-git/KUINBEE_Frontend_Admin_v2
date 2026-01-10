"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useThemeStore } from "@/store/theme.store";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { useLogin } from "@/hooks";
import type { ApiError } from "@/types";

export function LoginForm() {
  const { theme } = useThemeStore();
  const loginMutation = useLogin();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isDark = theme === "dark";

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

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className={`text-sm font-medium ${isDark ? "text-white/90" : "text-[#1a2240]"}`}
          >
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
            className={`h-12 glass-input transition-all ${
              isDark
                ? "border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:border-white/30 focus-visible:bg-white/10 focus-visible:shadow-lg focus-visible:shadow-white/10 disabled:bg-white/5 disabled:text-white/40"
                : "border-[#dde3f0] bg-white/70 text-[#1a2240] placeholder:text-[#8b93a5] focus-visible:ring-2 focus-visible:ring-[#1a2240]/10 focus-visible:border-[#bcc4d6] focus-visible:bg-white/95 focus-visible:shadow-lg focus-visible:shadow-[#1a2240]/8 disabled:bg-[#f5f7fb] disabled:text-[#8b93a5]"
            }`}
            style={{ backdropFilter: "blur(16px)" }}
          />
        </div>

        {/* Password Field */}
        <PasswordInput
          id="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loginMutation.isPending}
          isDark={isDark}
          required
        />

        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full h-12 text-white font-semibold disabled:opacity-50 mt-8 glass-button glass-shadow-hover border"
          style={{
            background: "linear-gradient(135deg, #1a2240 0%, #2a3250 100%)",
          }}
        >
          {loginMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </div>
          ) : (
            "Sign in"
          )}
        </Button>

        {/* Forgot Password Link */}
        <div className="text-center pt-4">
          <button
            type="button"
            disabled={loginMutation.isPending}
            className={`text-sm underline-offset-4 hover:underline disabled:no-underline transition-colors ${
              isDark
                ? "text-white/60 hover:text-white disabled:text-white/30"
                : "text-[#525d6f] hover:text-[#1a2240] disabled:text-[#8b93a5]"
            }`}
          >
            Forgot password
          </button>
        </div>
      </form>

      {/* Security Notice */}
      <div className={`mt-8 pt-6 border-t ${isDark ? "border-white/10" : "border-[#dde3f0]"}`}>
        <p className={`text-xs text-center leading-relaxed ${isDark ? "text-white/50" : "text-[#7a8494]"}`}>
          Access monitored · Additional verification may be required
        </p>
      </div>
    </>
  );
}
