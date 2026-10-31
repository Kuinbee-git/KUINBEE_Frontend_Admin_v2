import type { ReactNode } from 'react';
import {
  isDatasetPreparationProfileFieldApplicable,
  type DatasetContentMetadata,
  type DatasetPreparationProfiles,
} from '@kuinbee/dataset-preparation-contracts';

// Read-only presentation from this frozen snapshot. Retained inactive answers
// are left in the underlying response, never turned into current active claims.
export function ReviewContentMetadata({ metadata }: { metadata: DatasetContentMetadata }) {
  const enabled: Record<keyof DatasetPreparationProfiles, boolean> = {
    cad: metadata.modalities?.includes('CAD') ?? false,
    tabular: metadata.modalities?.includes('TABULAR') ?? false,
    audio: metadata.modalities?.includes('AUDIO') ?? false,
    images: metadata.modalities?.includes('IMAGE') ?? false,
    video: metadata.modalities?.includes('VIDEO') ?? false,
    text: metadata.modalities?.includes('TEXT') ?? false,
    sensors: metadata.modalities?.includes('SENSOR') ?? false,
    egocentric: metadata.contexts?.includes('EGOCENTRIC') ?? false,
    healthcare: metadata.contexts?.includes('HEALTHCARE') ?? false,
  };
  const profiles = Object.fromEntries(
    Object.entries(metadata.profiles ?? {})
      .filter(([key]) => enabled[key as keyof DatasetPreparationProfiles])
      .map(([key, value]) => [
        key,
        value
          ? Object.fromEntries(
              Object.entries(value).filter(([field]) =>
                isDatasetPreparationProfileFieldApplicable(
                  key as keyof DatasetPreparationProfiles,
                  field,
                  value
                )
              )
            )
          : value,
      ])
  );
  return (
    <div data-applicable-metadata>
      <ReviewFactTree value={{ ...metadata, ...(metadata.profiles ? { profiles } : {}) }} />
    </div>
  );
}

export const reviewLabel = (value: string) =>
  (/^[A-Z][A-Z_]+$/.test(value) ? value.toLowerCase() : value)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .replace(/^./, (c) => c.toUpperCase());
export function ReviewSection({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={'min-w-0 space-y-4 p-5 ' + className}
      style={{ borderColor: 'var(--border-default)' }}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
export function ReviewFacts({ rows }: { rows: ReadonlyArray<readonly [string, ReactNode]> }) {
  return (
    <dl className="grid gap-x-5 gap-y-3 sm:grid-cols-[minmax(9rem,1fr)_minmax(0,2fr)] text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt style={{ color: 'var(--text-muted)' }}>{label}</dt>
          <dd className="min-w-0 break-words whitespace-pre-wrap">
            {value === null || value === undefined || value === '' ? 'Not recorded' : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// Bounded canonical metadata only. React escapes every supplier string; no
// file HTML, preview, URL or inferred domain/medical facts are rendered here.
export function ReviewFactTree({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span>Not recorded</span>;
  if (typeof value === 'boolean') return <span>{value ? 'Yes' : 'No'}</span>;
  if (typeof value !== 'object')
    return <span className="break-words whitespace-pre-wrap">{String(value)}</span>;
  if (Array.isArray(value)) {
    if (!value.length) return <span>None recorded</span>;
    if (value.every((item) => typeof item !== 'object' || item === null))
      return <span className="break-words">{value.map(String).join(', ')}</span>;
    return (
      <ul className="space-y-3">
        {value.map((item, index) => (
          <li key={index}>
            <ReviewFactTree value={item} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ReviewFacts
      rows={Object.entries(value).map(([key, child]) => [
        reviewLabel(key),
        <ReviewFactTree key={key} value={child} />,
      ])}
    />
  );
}
