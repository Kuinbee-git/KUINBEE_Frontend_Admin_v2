/**
 * SegmentedToggle - Canonical control for fast, mutually exclusive state switching
 * 
 * Design Philosophy:
 * - Visually integrates with dropdowns (same height, spacing, rhythm)
 * - Feels like "segmented dropdown" not "pill buttons"
 * - Used only for high-frequency workflow switches with small option sets
 */

"use client";

import React from "react";

interface SegmentedToggleOption {
  value: string;
  label: string;
}

interface SegmentedToggleProps {
  label?: string;
  value: string;
  options: SegmentedToggleOption[];
  onChange: (value: string) => void;
}

export function SegmentedToggle({ label, value, options, onChange }: SegmentedToggleProps) {
  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
      )}
      <div
        className="inline-flex rounded-md"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          padding: "2px",
        }}
      >
        {options.map((option, index) => {
          const isActive = value === option.value;
          const isFirst = index === 0;
          const isLast = index === options.length - 1;
          
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className="px-3 py-1.5 text-xs transition-all"
              style={{
                backgroundColor: isActive ? "var(--brand-primary)" : "transparent",
                color: isActive ? "#ffffff" : "var(--text-primary)",
                borderRadius: isFirst 
                  ? "4px 0 0 4px" 
                  : isLast 
                  ? "0 4px 4px 0" 
                  : "0",
                border: "none",
                cursor: "pointer",
                fontWeight: isActive ? "500" : "400",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
