import type { ClaruJsonValue, ClaruMetadataField, ClaruMetadataSchema } from '@/types';

export type ClaruMetadataDraft = Record<string, string>;

export function claruMetadataDraft(
  custom: Record<string, ClaruJsonValue> = {}
): ClaruMetadataDraft {
  return Object.fromEntries(
    Object.entries(custom).map(([key, value]) => [
      key,
      value === null ? '' : typeof value === 'string' ? value : JSON.stringify(value),
    ])
  );
}

function validateValue(
  value: ClaruJsonValue | undefined,
  field: ClaruMetadataField,
  path: string
): string[] {
  if (value == null || (field.required && typeof value === 'string' && !value.trim())) {
    return field.required ? [`${path} is required.`] : [];
  }
  let valid: boolean;
  switch (field.type) {
    case 'string':
      valid = typeof value === 'string';
      break;
    case 'number':
      valid = typeof value === 'number' && Number.isFinite(value);
      break;
    case 'integer':
      valid = typeof value === 'number' && Number.isInteger(value);
      break;
    case 'boolean':
      valid = typeof value === 'boolean';
      break;
    case 'enum':
      valid = typeof value === 'string' && Boolean(field.options?.includes(value));
      break;
    case 'date':
    case 'timestamp': {
      const dateOnly = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
      const zoned =
        typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value);
      const dateTime =
        typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(value);
      valid =
        typeof value === 'string' &&
        (zoned || (field.type === 'date' && (dateOnly || dateTime))) &&
        Number.isFinite(Date.parse(value));
      if (valid) {
        const calendarDate = String(value).slice(0, 10);
        valid = new Date(`${calendarDate}T00:00:00Z`).toISOString().slice(0, 10) === calendarDate;
      }
      break;
    }
    case 'object':
      valid = typeof value === 'object' && !Array.isArray(value);
      break;
    case 'array':
      valid = Array.isArray(value);
      break;
  }
  if (!valid)
    return [
      `${path} must be ${field.type === 'timestamp' ? 'an ISO timestamp with seconds and a time zone' : `a valid ${field.type}`}.`,
    ];
  if (field.type === 'object' && field.fields) {
    const record = value as Record<string, ClaruJsonValue>;
    return field.fields.flatMap((child) =>
      child.name ? validateValue(record[child.name], child, `${path}.${child.name}`) : []
    );
  }
  if (field.type === 'array' && field.items) {
    return (value as ClaruJsonValue[]).flatMap((item, index) =>
      validateValue(item, field.items!, `${path}[${index}]`)
    );
  }
  return [];
}

function metadataProblem(value: ClaruJsonValue, path = ''): string | undefined {
  if (typeof value === 'number' && !Number.isFinite(value))
    return `${path} must be a finite JSON number.`;
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (Object.hasOwn(Object.prototype, key) || key === 'prototype')
      return `Rename reserved metadata key ${childPath}.`;
    const found = metadataProblem(child, childPath);
    if (found) return found;
  }
}

/** Preserve unlisted metadata, and block malformed JSON even on warning-only schemas. */
export function readClaruMetadata(
  schema: ClaruMetadataSchema | null | undefined,
  draft: ClaruMetadataDraft,
  original: Record<string, ClaruJsonValue> = {}
): { custom: Record<string, ClaruJsonValue>; errors: string[]; warnings: string[] } {
  const custom = { ...original };
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const field of schema?.fields ?? []) {
    if (!field.name) continue;
    const raw = draft[field.name] ?? '';
    if (!raw.trim()) {
      delete custom[field.name];
    } else if (['number', 'integer', 'boolean', 'object', 'array'].includes(field.type)) {
      try {
        custom[field.name] = JSON.parse(raw) as ClaruJsonValue;
      } catch {
        errors.push(`${field.name} must contain valid JSON for ${field.type}.`);
        continue;
      }
    } else {
      custom[field.name] = raw;
    }
    (schema?.enforced ? errors : warnings).push(
      ...validateValue(custom[field.name], field, field.name)
    );
  }
  const problem = metadataProblem(custom);
  if (problem) errors.push(problem);
  if (new TextEncoder().encode(JSON.stringify(custom)).length > 32_768)
    errors.push('Project metadata must not exceed 32 KiB.');
  return { custom, errors, warnings };
}
