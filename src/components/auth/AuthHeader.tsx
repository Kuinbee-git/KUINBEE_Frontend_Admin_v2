"use client";

import { motion } from "motion/react";
import { useThemeStore } from "@/store/theme.store";

interface AuthHeaderProps {
  title: string;
  description: string;
  showLogo?: boolean;
  logoText?: string;
}

export function AuthHeader({ 
  title, 
  description, 
  showLogo = true,
  logoText = "KUINBEE" 
}: AuthHeaderProps) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <div className="text-center mb-12">
      {showLogo && (
        <div className="inline-flex items-center gap-3 mb-6">
          <motion.div
            className={`h-12 px-6 border rounded-xl flex items-center justify-center shadow-lg ${
              isDark ? "glass-badge-dark" : "glass-badge-light"
            }`}
            animate={{
              transition: { duration: 0.4 },
            }}
          >
            <span
              className={`text-base font-semibold tracking-[0.12em] ${
                isDark ? "text-white" : "glass-badge-text"
              }`}
            >
              {logoText}
            </span>
          </motion.div>
        </div>
      )}
      <motion.h1
        className={`text-3xl font-semibold mb-3 ${isDark ? "text-white" : "text-[#1a2240]"}`}
        animate={{
          transition: { duration: 0.4 },
        }}
      >
        {title}
      </motion.h1>
      <motion.p
        className={`text-sm ${isDark ? "text-white/60" : "text-[#525d6f]"}`}
        animate={{
          transition: { duration: 0.4 },
        }}
      >
        {description}
      </motion.p>
    </div>
  );
}
