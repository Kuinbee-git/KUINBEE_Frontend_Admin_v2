'use client';

import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { BackgroundGlow } from './BackgroundGlow';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <motion.div
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--bg-base)] via-[var(--bg-surface)] to-[var(--bg-hover)] p-4 sm:p-6"
      style={{
        color: 'var(--text-primary)',
      }}
      animate={{
        transition: { duration: 0.8, ease: 'easeInOut' },
      }}
    >
      {/* Theme Toggle Button */}
      <ThemeToggle className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6" />
      <BackgroundGlow />

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
