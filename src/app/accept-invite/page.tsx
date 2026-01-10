"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthCard } from "@/components/auth/AuthCard";
import { AcceptInviteForm } from "@/components/auth/AcceptInviteForm";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/store/theme.store";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!mounted) {
      setMounted(true);
      const tokenParam = searchParams.get("token");
      setToken(tokenParam);
    }
  }, [searchParams, mounted]);

  if (!mounted) {
    return (
      <AuthLayout>
        <AuthHeader
          title="Accept Invitation"
          description="Loading invitation details..."
        />
        <AuthCard>
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-2 border-[#1a2240]/30 border-t-[#1a2240] rounded-full animate-spin" />
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  // Missing token
  if (!token) {
    return (
      <AuthLayout>
        <AuthHeader
          title="Invalid Invitation"
          description="No invitation token found"
        />
        <AuthCard>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div
              className={`inline-flex h-16 w-16 items-center justify-center rounded-full mb-4 ${
                isDark ? "bg-amber-500/10" : "bg-amber-50"
              }`}
            >
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
            
            <h3
              className={`text-lg font-semibold mb-2 ${
                isDark ? "text-white" : "text-[#1a2240]"
              }`}
            >
              Invalid Invitation Link
            </h3>
            
            <p
              className={`text-sm mb-6 ${
                isDark ? "text-white/60" : "text-[#525d6f]"
              }`}
            >
              The invitation link appears to be incomplete or invalid.
              <br />
              Please check your email for the correct link or contact support.
            </p>

            <Button
              onClick={() => router.push("/login")}
              variant="outline"
              className={`h-11 ${
                isDark
                  ? "border-white/20 text-white hover:bg-white/10"
                  : "border-[#dde3f0] text-[#1a2240] hover:bg-[#f5f7fb]"
              }`}
            >
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
        className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border ${
          isDark
            ? "bg-emerald-500/10 border-emerald-500/30 backdrop-blur-sm"
            : "bg-emerald-50 border-emerald-200"
        }`}
      >
        <div
          className={`flex items-center justify-center h-10 w-10 rounded-full ${
            isDark ? "bg-emerald-500/20" : "bg-emerald-100"
          }`}
        >
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p
            className={`text-sm font-medium ${
              isDark ? "text-emerald-400" : "text-emerald-700"
            }`}
          >
            Valid Invitation
          </p>
          <p
            className={`text-xs ${
              isDark ? "text-emerald-500/80" : "text-emerald-600"
            }`}
          >
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
          <AuthHeader
            title="Accept Invitation"
            description="Loading..."
          />
          <AuthCard>
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-2 border-[#1a2240]/30 border-t-[#1a2240] rounded-full animate-spin" />
            </div>
          </AuthCard>
        </AuthLayout>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
