'use client';

import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface AuthCardProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function AuthCard({ children, title, description }: AuthCardProps) {
  return (
    <motion.div
      animate={{
        transition: { duration: 0.4 },
      }}
    >
      <Card className="glass-card relative overflow-hidden border">
        {/* Rim light effect */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent" />

        {(title || description) && (
          <CardHeader className="space-y-2 p-6 pb-5 sm:p-8 sm:pb-6">
            {title && (
              <CardTitle className="text-xl font-semibold text-[var(--text-primary)]">
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className="text-sm text-[var(--text-muted)]">
                {description}
              </CardDescription>
            )}
          </CardHeader>
        )}

        <CardContent className={title || description ? 'p-6 pt-2 sm:p-8 sm:pt-2' : 'p-6 sm:p-8'}>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}
