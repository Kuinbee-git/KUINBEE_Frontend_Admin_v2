"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordInputProps {
  id: string;
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  isDark: boolean;
  required?: boolean;
}

export function PasswordInput({
  id,
  label = "Password",
  value,
  onChange,
  placeholder = "••••••••",
  disabled = false,
  isDark,
  required = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className={`text-sm font-medium ${isDark ? "text-white/90" : "text-[#1a2240]"}`}
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`h-12 pr-11 glass-input transition-all ${
            isDark
              ? "border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:border-white/30 focus-visible:bg-white/10 focus-visible:shadow-lg focus-visible:shadow-white/10 disabled:bg-white/5 disabled:text-white/40"
              : "border-[#dde3f0] bg-white/70 text-[#1a2240] placeholder:text-[#8b93a5] focus-visible:ring-2 focus-visible:ring-[#1a2240]/10 focus-visible:border-[#bcc4d6] focus-visible:bg-white/95 focus-visible:shadow-lg focus-visible:shadow-[#1a2240]/8 disabled:bg-[#f5f7fb] disabled:text-[#8b93a5]"
          }`}
          style={{ backdropFilter: "blur(16px)" }}
        />
        <motion.button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
            isDark
              ? "text-white/60 hover:text-white disabled:text-white/30"
              : "text-[#525d6f] hover:text-[#1a2240] disabled:text-[#8b93a5]"
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </motion.button>
      </div>
    </div>
  );
}
