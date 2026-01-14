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
}

export function AuthLayout({ children }: AuthLayoutProps) {
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
