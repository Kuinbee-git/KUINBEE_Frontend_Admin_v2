'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/store/theme.store';

interface ThemeToggleProps {
  className?: string;
  variant?: 'glass' | 'clean';
  size?: 'sm' | 'md';
}

export function ThemeToggle({ className = '', variant = 'glass', size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  // Glass variant - for auth pages
  if (variant === 'glass') {
    return (
      <motion.button
        onClick={toggleTheme}
        className={`flex h-11 w-11 items-center justify-center rounded-xl border bg-[var(--glass-bg)] text-[var(--text-primary)] backdrop-blur-sm transition-all hover:bg-[var(--bg-hover)] ${className}`}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isDark ? 'sun' : 'moon'}
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
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const buttonSize = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';

  return (
    <motion.button
      onClick={toggleTheme}
      className={`${buttonSize} rounded-lg flex items-center justify-center border transition-all hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${className}`}
      style={{
        backgroundColor: 'var(--bg-base)',
        borderColor: 'var(--border-default)',
        color: 'var(--text-primary)',
      }}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isDark ? 'sun' : 'moon'}
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
