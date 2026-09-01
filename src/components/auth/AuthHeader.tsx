'use client';

import { motion } from 'motion/react';

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
  logoText = 'KUINBEE',
}: AuthHeaderProps) {
  return (
    <div className="mb-8 text-center sm:mb-10">
      {showLogo && (
        <div className="inline-flex items-center gap-3 mb-6">
          <motion.div
            className="glass-badge-light flex h-12 items-center justify-center rounded-xl border px-6"
            animate={{
              transition: { duration: 0.4 },
            }}
          >
            <span className="glass-badge-text text-base font-semibold tracking-[0.12em]">
              {logoText}
            </span>
          </motion.div>
        </div>
      )}
      <motion.h1
        className="mb-3 text-3xl font-semibold text-[var(--text-primary)]"
        animate={{
          transition: { duration: 0.4 },
        }}
      >
        {title}
      </motion.h1>
      <motion.p
        className="text-sm text-[var(--text-muted)]"
        animate={{
          transition: { duration: 0.4 },
        }}
      >
        {description}
      </motion.p>
    </div>
  );
}
