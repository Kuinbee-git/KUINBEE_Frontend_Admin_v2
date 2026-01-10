"use client";

import { motion, AnimatePresence } from "motion/react";
import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/store/theme.store";
import { useState } from "react";

interface ThemeToggleProps {
  className?: string;
  variant?: "glass" | "clean";
  size?: "sm" | "md";
}

export function ThemeToggle({ className = "", variant = "glass", size = "md" }: ThemeToggleProps) {
  const { theme, setTheme } = useThemeStore();
  const isDark = theme === "dark";
  const [isHovered, setIsHovered] = useState(false);

  // Glass variant - for auth pages
  if (variant === "glass") {
    return (
      <motion.button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`h-11 w-11 rounded-xl flex items-center justify-center border transition-all ${
          isDark
            ? "bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            : "bg-white/60 backdrop-blur-sm border-[#e3e6f3] text-[#111827] hover:bg-white/80"
        } ${className}`}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        aria-label="Toggle theme"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isDark ? "sun" : "moon"}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    );
  }

  // Clean variant - for dashboard
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const buttonSize = size === "sm" ? "h-9 w-9" : "h-11 w-11";

  return (
    <motion.button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`${buttonSize} rounded-lg flex items-center justify-center border transition-all ${className}`}
      style={{
        backgroundColor: isHovered ? "var(--bg-hover)" : "var(--bg-base)",
        borderColor: "var(--border-default)",
        color: "var(--text-primary)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isDark ? "sun" : "moon"}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isDark ? <Sun className={iconSize} /> : <Moon className={iconSize} />}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
