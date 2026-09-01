'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import type { DatasetVisibility } from '@/types/dataset.types';
import { ChevronDown, Globe, Link2, Loader2, Lock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type VisibilityOption = {
  value: DatasetVisibility;
  label: string;
  icon: ReactNode;
  color: string;
  bg: string;
  border: string;
};

const DEFAULT_VISIBILITY_OPTION: VisibilityOption = {
  value: 'PUBLIC',
  label: 'Public',
  icon: <Globe className="w-3 h-3" aria-hidden="true" />,
  color: 'var(--status-success)',
  bg: 'var(--status-success-bg)',
  border: 'var(--status-success-border)',
};

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  DEFAULT_VISIBILITY_OPTION,
  {
    value: 'PRIVATE',
    label: 'Private',
    icon: <Lock className="w-3 h-3" aria-hidden="true" />,
    color: 'var(--status-error)',
    bg: 'var(--status-error-bg)',
    border: 'var(--status-error-border)',
  },
  {
    value: 'UNLISTED',
    label: 'Unlisted',
    icon: <Link2 className="w-3 h-3" aria-hidden="true" />,
    color: 'var(--status-neutral)',
    bg: 'var(--status-neutral-bg)',
    border: 'var(--status-neutral-border)',
  },
];

interface VisibilityCellProps {
  datasetId: string;
  visibility: DatasetVisibility;
  onVisibilityChange: (datasetId: string, visibility: DatasetVisibility) => Promise<void>;
  canEdit: boolean;
}

export function VisibilityCell({
  datasetId,
  visibility,
  onVisibilityChange,
  canEdit,
}: VisibilityCellProps) {
  const [pending, setPending] = useState(false);

  const current =
    VISIBILITY_OPTIONS.find((option) => option.value === visibility) ?? DEFAULT_VISIBILITY_OPTION;

  const handleSelect = async (nextVisibility: DatasetVisibility) => {
    if (nextVisibility === visibility) {
      return;
    }

    setPending(true);
    try {
      await onVisibilityChange(datasetId, nextVisibility);
    } finally {
      setPending(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={pending || !canEdit}>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          aria-label={
            canEdit ? `Change visibility from ${current.label}` : `Visibility: ${current.label}`
          }
          className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-50"
          style={{ color: current.color, background: current.bg, borderColor: current.border }}
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : current.icon}
          {current.label}
          {canEdit ? <ChevronDown className="h-2.5 w-2.5 opacity-60" aria-hidden="true" /> : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[140px]"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuRadioGroup
          value={visibility}
          onValueChange={(value) => void handleSelect(value as DatasetVisibility)}
        >
          {VISIBILITY_OPTIONS.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="text-xs"
              style={{ color: option.color }}
            >
              {option.icon}
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
