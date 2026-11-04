'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ClaruMetadataSchema } from '@/types';
import type { ClaruMetadataDraft } from './claruMetadataUtils';

export function ClaruMetadataFields({
  schema,
  value,
  onChange,
  idPrefix,
  shared = false,
}: {
  schema?: ClaruMetadataSchema | null;
  value: ClaruMetadataDraft;
  onChange: (value: ClaruMetadataDraft) => void;
  idPrefix: string;
  shared?: boolean;
}) {
  if (!schema?.fields.length) return null;
  return (
    <section
      className="space-y-4 border-t pt-4"
      style={{ borderColor: 'var(--border-default)' }}
      aria-label="Project metadata"
    >
      <div>
        <h3 className="text-sm font-semibold">
          {shared ? 'Shared project metadata' : 'Project metadata'}
        </h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {shared
            ? 'Apply common values, then review the recording dates, times and intrinsics for each clip.'
            : schema.enforced
              ? 'Complete the required fields before uploading. Use the actual capture details.'
              : 'Claru records these fields for the reviewer; missing or incorrect values are warnings.'}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {schema.fields.map((field) => {
          if (!field.name) return null;
          const id = `${idPrefix}-${field.name}`;
          const raw = value[field.name] ?? '';
          const update = (next: string) => onChange({ ...value, [field.name!]: next });
          const label = field.name.replace(/_/g, ' ').replace(/^./, (first) => first.toUpperCase());
          return (
            <div
              key={field.name}
              className={`min-w-0 space-y-2 ${['object', 'array'].includes(field.type) ? 'sm:col-span-2' : ''}`}
            >
              <Label htmlFor={id}>
                {label}
                {field.required ? ' *' : ''}
              </Label>
              {field.type === 'object' || field.type === 'array' ? (
                <Textarea
                  id={id}
                  value={raw}
                  rows={4}
                  maxLength={32_768}
                  onChange={(event) => update(event.target.value)}
                  placeholder={
                    field.name === 'camera_intrinsics'
                      ? '{ "width": 1920, "height": 1440, "K": [[1200,0,960],[0,1200,720],[0,0,1]] }'
                      : field.type === 'object'
                        ? '{}'
                        : '[]'
                  }
                  aria-describedby={`${id}-help`}
                  className="font-mono text-xs"
                />
              ) : field.type === 'enum' || field.type === 'boolean' ? (
                <select
                  id={id}
                  value={raw}
                  onChange={(event) => update(event.target.value)}
                  aria-describedby={`${id}-help`}
                  className="h-10 w-full rounded-md border bg-[var(--bg-base)] px-3 text-sm"
                >
                  <option value="">Choose a value</option>
                  {(field.type === 'boolean' ? ['true', 'false'] : (field.options ?? [])).map(
                    (option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    )
                  )}
                </select>
              ) : (
                <Input
                  id={id}
                  value={raw}
                  maxLength={32_768}
                  onChange={(event) => update(event.target.value)}
                  inputMode={
                    field.type === 'number' || field.type === 'integer' ? 'decimal' : undefined
                  }
                  placeholder={
                    field.type === 'timestamp'
                      ? '2026-11-04T09:12:00+05:30'
                      : field.type === 'date'
                        ? 'YYYY-MM-DD'
                        : undefined
                  }
                  aria-describedby={`${id}-help`}
                />
              )}
              <p id={`${id}-help`} className="break-words text-xs text-[var(--text-muted)]">
                {field.description ??
                  (field.type === 'object' || field.type === 'array'
                    ? 'Enter valid JSON.'
                    : field.type === 'timestamp'
                      ? 'Include seconds and a time zone.'
                      : field.name)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
