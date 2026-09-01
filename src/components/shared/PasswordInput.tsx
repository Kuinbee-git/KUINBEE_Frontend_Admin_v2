'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordInputProps {
  id: string;
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
}

export function PasswordInput({
  id,
  label = 'Password',
  value,
  onChange,
  placeholder = '••••••••',
  disabled = false,
  required = false,
  autoComplete,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-[var(--text-primary)]">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          maxLength={128}
          autoComplete={autoComplete}
          className="glass-input h-12 pr-11 text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] disabled:bg-[var(--bg-hover)] disabled:text-[var(--text-disabled)]"
          style={{ backdropFilter: 'blur(16px)' }}
        />
        <motion.button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:text-[var(--text-disabled)]"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
