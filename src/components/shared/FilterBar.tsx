'use client';

import React, { ReactNode, useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { SegmentedToggle } from '@/components/shared/SegmentedToggle';

type FilterType = 'search' | 'select' | 'toggle' | 'checkbox' | 'popover';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig<T = string | string[] | boolean> {
  id: string;
  type: FilterType;
  label: string;
  placeholder?: string;
  value: string | string[] | boolean;
  onChange: (value: T) => void;
  options?: FilterOption[];
  width?: string;
  icon?: ReactNode;
  showInPrimary?: boolean; // Show in main row vs advanced filters
}

export interface ActiveFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FilterBarProps {
  filters: FilterConfig<unknown>[];
  activeFilters?: ActiveFilter[];
  onClearAll?: () => void;
  showAdvancedFilters?: boolean;
}

export function FilterBar({
  filters,
  activeFilters = [],
  onClearAll,
  showAdvancedFilters = false,
}: FilterBarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const primaryFilters = filters.filter((f) => f.showInPrimary !== false);
  const advancedFilters = filters.filter((f) => f.showInPrimary === false);

  const renderFilter = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'search':
        return (
          <div key={filter.id} className="w-full min-w-0 flex-1 sm:max-w-md">
            <Label
              htmlFor={filter.id}
              className="text-xs mb-1.5 block"
              style={{ color: 'var(--text-muted)' }}
            >
              {filter.label}
            </Label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--text-muted)' }}
                aria-hidden="true"
              />
              <Input
                id={filter.id}
                type="search"
                placeholder={filter.placeholder}
                value={filter.value as string}
                onChange={(e) => filter.onChange(e.target.value)}
                className="pl-10"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={filter.id} className="w-full sm:w-auto">
            <Label
              htmlFor={filter.id}
              className="text-xs mb-1.5 block"
              style={{ color: 'var(--text-muted)' }}
            >
              {filter.label}
            </Label>
            <Select value={filter.value as string} onValueChange={filter.onChange}>
              <SelectTrigger
                id={filter.id}
                aria-label={filter.label}
                className="h-9 w-full sm:w-[180px]"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'toggle':
        return (
          <SegmentedToggle
            key={filter.id}
            label={filter.label}
            value={filter.value as string}
            options={filter.options || []}
            onChange={filter.onChange}
          />
        );

      case 'checkbox':
        return (
          <div key={filter.id} className="flex min-h-9 items-center gap-2">
            <Checkbox
              id={filter.id}
              checked={Boolean(filter.value)}
              onCheckedChange={(checked) => filter.onChange(checked === true)}
            />
            <Label
              htmlFor={filter.id}
              className="cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              {filter.label}
            </Label>
          </div>
        );

      case 'popover':
        return (
          <Popover key={filter.id}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              >
                {filter.label}
                {Array.isArray(filter.value) && filter.value.length > 0 && (
                  <span
                    className="ml-2 px-1.5 py-0.5 text-xs rounded"
                    style={{
                      backgroundColor: 'var(--brand-primary)',
                      color: 'var(--brand-on-primary)',
                    }}
                  >
                    {filter.value.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
              }}
            >
              <div className="space-y-3">
                <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {filter.label}
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filter.options?.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${filter.id}-${option.value}`}
                        checked={(filter.value as string[]).includes(option.value)}
                        onCheckedChange={(checked) => {
                          const currentValues = filter.value as string[];
                          if (checked) {
                            filter.onChange([...currentValues, option.value]);
                          } else {
                            filter.onChange(currentValues.filter((v) => v !== option.value));
                          }
                        }}
                      />
                      <label
                        htmlFor={`${filter.id}-${option.value}`}
                        className="text-sm cursor-pointer"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="border-b"
      style={{
        backgroundColor: 'var(--bg-base)',
        borderColor: 'var(--border-default)',
      }}
    >
      {/* Primary Filters Row */}
      <div className="px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-end gap-4">
          {primaryFilters.map((filter, index) => (
            <React.Fragment key={filter.id}>
              {renderFilter(filter)}
              {/* Add separator between toggles and selects/popovers */}
              {filter.type === 'toggle' &&
                index < primaryFilters.length - 1 &&
                primaryFilters[index + 1]?.type !== 'toggle' && (
                  <div
                    className="hidden h-8 w-px sm:block"
                    style={{ backgroundColor: 'var(--border-default)' }}
                  />
                )}
            </React.Fragment>
          ))}

          {/* Advanced Filters Toggle */}
          {showAdvancedFilters && advancedFilters.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdvancedOpen((current) => !current)}
              aria-expanded={advancedOpen}
              className="w-full sm:ml-auto sm:w-auto"
              style={{
                backgroundColor: advancedOpen ? 'var(--bg-hover)' : 'var(--bg-base)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" aria-hidden="true" />
              Advanced Filters
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && advancedOpen && advancedFilters.length > 0 && (
        <div
          className="border-t px-4 pb-6 pt-0 sm:px-6"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex flex-wrap items-center gap-4 pt-4">
            {advancedFilters.map(renderFilter)}
          </div>
        </div>
      )}

      {/* Active Filters Chips */}
      {activeFilters.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 px-4 pb-4 sm:px-6"
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1rem',
          }}
        >
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Active Filters:
          </span>
          {activeFilters.map((filter) => (
            <button
              type="button"
              key={filter.key}
              onClick={filter.onRemove}
              aria-label={`Remove filter: ${filter.label}`}
              className="flex items-center gap-1.5 rounded-md border bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)]"
              style={{
                borderColor: 'var(--border-default)',
              }}
            >
              {filter.label}
              <X className="w-3 h-3" aria-hidden="true" />
            </button>
          ))}
          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="ml-2 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--status-error)]"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
