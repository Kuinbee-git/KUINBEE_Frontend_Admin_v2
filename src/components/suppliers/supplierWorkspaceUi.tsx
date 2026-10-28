import { StatusBadge, type SemanticStatus } from '@/components/shared/StatusBadge';
import { getSafeHttpUrl } from '@/lib/utils/url.utils';
import type { SupplierDirectoryItem } from '@/lib/supplier-workspace-contracts';
export const stageLabels: Record<string, string> = {
  APPLICATION_DRAFT: 'Application draft',
  APPLICATION_SUBMITTED: 'Application review',
  INFORMATION_REQUESTED: 'Information requested',
  INVITED: 'Invited',
  INVITATION_EXPIRED: 'Invitation expired',
  INVITATION_REVOKED: 'Invitation revoked',
  VERIFICATION_DRAFT: 'Verification in progress',
  VERIFICATION_SUBMITTED: 'Verification review',
  CHANGES_REQUESTED: 'Changes requested',
  APPROVED: 'Verified',
  REJECTED: 'Rejected',
  LEGACY_PENDING: 'Onboarding incomplete',
};
export function SupplierStage({ stage }: { stage: string }) {
  const semantic: SemanticStatus =
    stage === 'APPROVED'
      ? 'success'
      : stage === 'REJECTED'
        ? 'error'
        : stage.includes('EXPIRED') || stage.includes('REVOKED') || stage === 'CHANGES_REQUESTED'
          ? 'warning'
          : stage.includes('SUBMITTED')
            ? 'in_progress'
            : stage === 'INVITED'
              ? 'pending'
              : 'neutral';
  return <StatusBadge status={stageLabels[stage] ?? stage} semanticType={semantic} />;
}
export const supplierHref = (r: SupplierDirectoryItem) =>
  r.applicationId
    ? `/dashboard/supplier-applications/${r.applicationId}`
    : `/dashboard/suppliers/${r.supplierId}`;
export const dateTime = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString() : 'Not recorded';
export function Value({ value }: { value: unknown }) {
  return (
    <span className="whitespace-pre-wrap break-words">
      {Array.isArray(value)
        ? value.join(', ') || 'Not provided'
        : typeof value === 'boolean'
          ? value
            ? 'Yes'
            : 'No'
          : String(value === null || value === undefined || value === '' ? 'Not provided' : value)}
    </span>
  );
}
export function Fields({ items }: { items: Record<string, unknown> }) {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {Object.entries(items).map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
          <dd className="mt-1 text-sm">
            <Value value={value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
export function SafeLink({ url, label }: { url: string | null; label?: string }) {
  const safe = getSafeHttpUrl(url);
  return safe ? (
    <a
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-sm underline underline-offset-4"
    >
      {label || url}
    </a>
  ) : (
    <Value value={url} />
  );
}
// Export only the authorized, currently displayed directory rows. Quoting alone
// does not stop spreadsheet formulas, so prefix dangerous cells as text.
export function supplierCsv(rows: SupplierDirectoryItem[]) {
  const cell = (v: unknown) => {
    let s = String(v ?? '');
    if (/^[\s]*[=+@-]/.test(s) || /^[\t\r\n]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const data = [
    [
      'Name',
      'Email',
      'Type',
      'Country',
      'Capabilities',
      'Stage',
      'Account status',
      'Contract',
      'Updated',
    ],
    ...rows.map((r) => [
      r.name,
      r.email,
      r.supplierType,
      r.country,
      r.domains.join('; '),
      stageLabels[r.stage] ?? r.stage,
      r.accountStatus ?? 'No account',
      r.contractComplete === null ? 'Not applicable' : r.contractComplete ? 'Complete' : 'Pending',
      r.updatedAt,
    ]),
  ];
  return '\uFEFF' + data.map((row) => row.map(cell).join(',')).join('\r\n');
}
