"use client";

import { motion, AnimatePresence } from "motion/react";

interface BackgroundGlowProps {
  isDark: boolean;
}

export function BackgroundGlow({ isDark }: BackgroundGlowProps) {
  return (
    <AnimatePresence mode="wait">
      {isDark ? (
        <motion.div
          key="dark-glows"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl"
            style={{ background: "radial-gradient(circle, #2a3a50 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl"
            style={{ background: "radial-gradient(circle, #3a4a60 0%, transparent 70%)" }}
          />
        </motion.div>
      ) : (
        <motion.div
          key="light-glows"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, #e8ecf6 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl"
            style={{ background: "radial-gradient(circle, #f0f4f8 0%, transparent 70%)" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
