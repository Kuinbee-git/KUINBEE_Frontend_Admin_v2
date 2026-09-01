'use client';

import { motion } from 'motion/react';

export function BackgroundGlow() {
  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div
        className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full opacity-25 blur-3xl sm:h-[500px] sm:w-[500px]"
        style={{ background: 'radial-gradient(circle, var(--auth-glow-one) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full opacity-20 blur-3xl sm:h-[500px] sm:w-[500px]"
        style={{ background: 'radial-gradient(circle, var(--auth-glow-two) 0%, transparent 70%)' }}
      />
    </motion.div>
  );
}
