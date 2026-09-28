'use client';

import { useId, useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { ClaruProjectCategory } from '@/types';

export function ClaruCategoryPicker({
  id,
  categories,
  value,
  onChange,
}: {
  id: string;
  categories: ClaruProjectCategory[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const selected = categories.find((category) => category.code === value);
  const matches = useMemo(
    () =>
      categories
        .filter((category) =>
          `${category.name} ${category.parent?.name ?? ''} ${category.code}`
            .toLowerCase()
            .includes(search.trim().toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories, search]
  );
  const choose = (code: string) => {
    onChange(code);
    setOpen(false);
  };
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setSearch('');
        setActive(0);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className="w-full min-w-0 justify-between font-normal"
        >
          <span className="truncate">
            {selected?.name ?? (value || 'Choose the activity category')}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(420px,calc(100vw-3rem))] max-w-[var(--radix-popover-content-available-width)] p-2"
      >
        <Input
          placeholder="Search category or activity…"
          aria-label="Search activity categories"
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={matches[active] ? `${listId}-${active}` : undefined}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              const next = Math.max(
                0,
                Math.min(matches.length - 1, active + (event.key === 'ArrowDown' ? 1 : -1))
              );
              setActive(next);
              document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: 'nearest' });
            } else if (event.key === 'Enter') {
              event.preventDefault();
              if (matches[active]) choose(matches[active].code);
            }
          }}
        />
        <div
          id={listId}
          role="listbox"
          aria-label="Activity categories"
          className="mt-2 max-h-60 overflow-y-auto overscroll-contain"
        >
          {matches.map((category, index) => (
            <button
              key={category.code}
              id={`${listId}-${index}`}
              type="button"
              role="option"
              aria-selected={value === category.code}
              tabIndex={-1}
              onMouseMove={() => setActive(index)}
              onClick={() => choose(category.code)}
              className={`flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm ${index === active ? 'bg-[var(--bg-selected)]' : 'hover:bg-[var(--bg-hover)]'}`}
            >
              <span className="min-w-0 flex-1 break-words">
                <span className="block font-medium">{category.name}</span>
                {category.parent ? (
                  <span className="block text-xs text-[var(--text-muted)]">
                    {category.parent.name}
                  </span>
                ) : null}
              </span>
              {value === category.code ? (
                <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              ) : null}
            </button>
          ))}
        </div>
        <p className="px-3 py-2 text-xs text-[var(--text-muted)]" role="status">
          {matches.length
            ? `${matches.length} categories · Type to filter, use arrow keys to choose`
            : 'No categories match. Try a different activity.'}
        </p>
      </PopoverContent>
    </Popover>
  );
}
