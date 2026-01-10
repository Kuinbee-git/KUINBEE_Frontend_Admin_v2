"use client";

import { ReactNode } from "react";
import { motion } from "motion/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useThemeStore } from "@/store/theme.store";

interface AuthCardProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function AuthCard({ children, title, description }: AuthCardProps) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <motion.div
      animate={{
        transition: { duration: 0.4 },
      }}
    >
      <Card
        className="overflow-hidden relative glass-card border-0"
        style={{
          background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(24px)",
          boxShadow: isDark
            ? "0 20px 60px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
            : "0 20px 60px rgba(26, 34, 64, 0.15), 0 8px 24px rgba(26, 34, 64, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
        }}
      >
        {/* Rim light effect */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: isDark
              ? "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%)"
              : "linear-gradient(90deg, transparent 0%, rgba(26, 34, 64, 0.12) 50%, transparent 100%)",
          }}
        />

        {(title || description) && (
          <CardHeader className="space-y-2 p-8 pb-6">
            {title && (
              <CardTitle className={`text-xl font-semibold ${isDark ? "text-white" : "text-[#1a2240]"}`}>
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className={`text-sm ${isDark ? "text-white/60" : "text-[#525d6f]"}`}>
                {description}
              </CardDescription>
            )}
          </CardHeader>
        )}

        <CardContent className={title || description ? "p-8 pt-2" : "p-8"}>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}
