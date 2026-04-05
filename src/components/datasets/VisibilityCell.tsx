"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { DatasetVisibility } from "@/types/dataset.types";
import { ChevronDown, Globe, Link2, Loader2, Lock } from "lucide-react";

const VISIBILITY_OPTIONS: { value: DatasetVisibility; label: string; icon: ReactNode; color: string; bg: string }[] = [
  {
    value: "PUBLIC",
    label: "Public",
    icon: <Globe className="w-3 h-3" />,
    color: "var(--color-success, #16a34a)",
    bg: "rgba(22, 163, 74, 0.08)",
  },
  {
    value: "PRIVATE",
    label: "Private",
    icon: <Lock className="w-3 h-3" />,
    color: "var(--color-error, #dc2626)",
    bg: "rgba(220, 38, 38, 0.08)",
  },
  {
    value: "UNLISTED",
    label: "Unlisted",
    icon: <Link2 className="w-3 h-3" />,
    color: "var(--text-muted, #6b7280)",
    bg: "rgba(107, 114, 128, 0.08)",
  },
];

interface VisibilityCellProps {
  datasetId: string;
  visibility: DatasetVisibility;
  onVisibilityChange: (datasetId: string, visibility: DatasetVisibility) => Promise<void>;
}

export function VisibilityCell({ datasetId, visibility, onVisibilityChange }: VisibilityCellProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const current = VISIBILITY_OPTIONS.find((o) => o.value === visibility) ?? VISIBILITY_OPTIONS[0];

  const handleSelect = async (nextVisibility: DatasetVisibility) => {
    if (nextVisibility === visibility) {
      setOpen(false);
      return;
    }

    setPending(true);
    setOpen(false);
    try {
      await onVisibilityChange(datasetId, nextVisibility);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ color: current.color, background: current.bg, borderColor: `${current.color}33` }}
      >
        {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : current.icon}
        {current.label}
        <ChevronDown className="w-2.5 h-2.5 opacity-60" />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 left-0 rounded-lg border shadow-lg overflow-hidden"
          style={{ minWidth: 130, backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
        >
          {VISIBILITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:opacity-80 transition-opacity"
              style={{
                color: option.color,
                backgroundColor: option.value === visibility ? option.bg : "transparent",
                fontWeight: option.value === visibility ? 600 : 400,
              }}
            >
              {option.icon}
              {option.label}
              {option.value === visibility && <span className="ml-auto text-[10px] opacity-60">current</span>}
            </button>
          ))}
        </div>
      )}

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}
