"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useThemeStore } from "@/store/theme.store";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { BackgroundGlow } from "./BackgroundGlow";

interface AuthLayoutProps {
  children: ReactNode;
  showSkipButton?: boolean;
  skipUrl?: string;
}

export function AuthLayout({ 
  children, 
  showSkipButton = false,
  skipUrl = "/dashboard" 
}: AuthLayoutProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #1a2240 0%, #2a3250 50%, #1f2847 100%)"
          : "linear-gradient(135deg, #ffffff 0%, #f9fafb 50%, #f5f7fb 100%)",
      }}
      animate={{
        transition: { duration: 0.8, ease: "easeInOut" },
      }}
    >
      {/* Theme Toggle Button */}
      <ThemeToggle className="absolute top-6 right-6 z-20" />

      {/* Skip to Dashboard Button */}
      {showSkipButton && (
        <motion.button
          onClick={() => router.push(skipUrl)}
          className={`absolute top-6 right-20 h-11 w-11 rounded-xl flex items-center justify-center border transition-all z-20 ${
            isDark
              ? "bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              : "bg-white/60 backdrop-blur-sm border-[#e3e6f3] text-[#111827] hover:bg-white/80"
          }`}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          title="Skip to Dashboard"
        >
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      )}

      {/* Background Glow Effects */}
      <BackgroundGlow isDark={isDark} />

      {/* Content */}
      <motion.div
        className="w-full max-w-[460px] relative z-10"
        animate={{
          transition: { duration: 0.4 },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
