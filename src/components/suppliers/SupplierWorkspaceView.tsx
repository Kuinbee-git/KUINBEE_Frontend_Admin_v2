'use client';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, UserRound, Copy, Download, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuthorization } from '@/hooks/useAuthorization';
import { supplierWorkspace } from '@/services/supplier-workspace.service';
import { supplierApplications } from '@/services/supplier-applications.service';
import { markOfflineContractDone } from '@/services/suppliers.service';
import type {
  SupplierAdminWorkspace,
  SupplierAdminEntryDto,
  SupplierInvitationHistoryItem,
} from '@/lib/supplier-workspace-contracts';
import type { SupplierReviewDecision } from '@/lib/supplier-onboarding-contracts';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';
import { openExternalUrl } from '@/lib/utils/url.utils';
import { SupplierStage, Fields, SafeLink, dateTime, stageLabels } from './supplierWorkspaceUi';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2} className="text-base">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
function safeReturn(value: string | null) {
  return value && /^\/dashboard\/suppliers(?:\?|$)/.test(value) ? value : '/dashboard/suppliers';
}
export function SupplierWorkspaceView({ recordId }: { recordId: string }) {
  const { can, user } = useAuthorization(),
    cache = useQueryClient(),
    search = useSearchParams();
  const allowed = can({ anyOf: ['VIEW_SUPPLIER', 'MANAGE_SUPPLIER_VERIFICATION'] });
  const canReview = can({ allOf: ['MANAGE_SUPPLIER_VERIFICATION'] });
  const query = useQuery({
    queryKey: ['supplier-workspace', recordId, user?.id, canReview],
    queryFn: () => supplierWorkspace.get(recordId),
    enabled: allowed,
  });
  const [tab, setTab] = useState('overview'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const [note, setNote] = useState(''),
    [file, setFile] = useState<File | null>(null),
    [summary, setSummary] = useState(''),
    [sourceUrl, setSourceUrl] = useState('');
  const [contractConfirm, setContractConfirm] = useState(false);
  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      await query.refetch();
      await cache.invalidateQueries({ queryKey: ['supplier-directory'] });
      await cache.invalidateQueries({ queryKey: ['supplier-history', recordId] });
      setNotice(message);
      return true;
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
      await query.refetch();
      return false;
    } finally {
      setBusy(false);
    }
  }
  const historyOptions = (
    kind: 'NOTE' | 'EVIDENCE' | 'ACTIVITY' | 'INVITATION',
    active: boolean
  ) => ({
    queryKey: ['supplier-history', recordId, user?.id, canReview, kind],
    initialPageParam: null as string | null,
    getNextPageParam: (page: { nextCursor: string | null }) => page.nextCursor ?? undefined,
    enabled: allowed && canReview && active,
  });
  const notesQuery = useInfiniteQuery({
    ...historyOptions('NOTE', tab === 'history'),
    queryFn: ({ pageParam }) =>
      supplierWorkspace.history<SupplierAdminEntryDto>(recordId, 'NOTE', pageParam),
  });
  const evidenceQuery = useInfiniteQuery({
    ...historyOptions('EVIDENCE', tab === 'evidence'),
    queryFn: ({ pageParam }) =>
      supplierWorkspace.history<SupplierAdminEntryDto>(recordId, 'EVIDENCE', pageParam),
  });
  const activityQuery = useInfiniteQuery({
    ...historyOptions('ACTIVITY', tab === 'history'),
    queryFn: ({ pageParam }) =>
      supplierWorkspace.history<SupplierAdminWorkspace['activity'][number]>(
        recordId,
        'ACTIVITY',
        pageParam
      ),
  });
  const invitationQuery = useInfiniteQuery({
    ...historyOptions('INVITATION', tab === 'history'),
    queryFn: ({ pageParam }) =>
      supplierWorkspace.history<SupplierInvitationHistoryItem>(recordId, 'INVITATION', pageParam),
  });
  const invitationEntries = invitationQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const notesEntries = notesQuery.data?.pages.flatMap((p) => p.items) ?? [],
    evidenceEntries = evidenceQuery.data?.pages.flatMap((p) => p.items) ?? [],
    activityEntries = activityQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const data = query.data;
  if (!allowed) return <p className="p-6">You do not have permission to view suppliers.</p>;
  if (query.isPending)
    return (
      <p className="p-6" role="status">
        Loading supplier workspace…
      </p>
    );
  if (query.isError || !data)
    return (
      <div className="space-y-4 p-6">
        <Link className="underline" href={safeReturn(search.get('returnTo'))}>
          Back to suppliers
        </Link>
        <p role="alert">{getFriendlyErrorMessage(query.error)}</p>
        <Button variant="outline" onClick={() => query.refetch()}>
          Retry
        </Button>
      </div>
    );
  const r = data.record,
    a = data.review,
    current = a?.reviews.find((v) => !v.decision);
  const documents = current?.snapshot.documents ?? a?.documents ?? [];
  const checklist = current?.snapshot.documentChecklist ?? a?.documentChecklist ?? [];
  const missing = checklist.filter(
    (s) => s.required && !documents.some((d) => d.requirementKey === s.key)
  );
  const overviewIdentity = data.approvedIdentity ?? data.identity;
  async function downloadEvidence(id: string) {
    await run(async () => {
      const link = await supplierWorkspace.download(r.recordId, id);
      openExternalUrl(link.url);
    }, 'Private evidence download opened.');
  }
  return (
    <div>
      <PageHeader
        title={r.name}
        description={
          <span>
            {r.email} ·{' '}
            {r.supplierType === 'COMPANY'
              ? 'Company'
              : r.supplierType === 'INDIVIDUAL'
                ? 'Individual'
                : 'Type not provided'}{' '}
            · {r.country || 'Country not provided'}
          </span>
        }
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const summary = {
                  exportedAt: new Date().toISOString(),
                  record: data.record,
                  identity: data.identity,
                  approvedIdentity: data.approvedIdentity,
                  capabilities: data.capabilities,
                  account: data.account,
                  source: data.source,
                  contract: data.contract,
                  ...(data.permissions.review
                    ? {
                        reviews: data.review?.reviews,
                        legacyManualKyc: data.legacyManualKyc,
                      }
                    : {}),
                };
                const url = URL.createObjectURL(
                  new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' })
                );
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = 'supplier-' + r.recordId.replace(':', '-') + '.json';
                anchor.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              <Download />
              Export summary
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${r.name}\n${r.email}\nRecord: ${r.recordId}`
                  );
                  toast.success('Supplier details copied');
                } catch {
                  toast.error('Could not copy details');
                }
              }}
            >
              <Copy />
              Copy details
            </Button>
          </div>
        }
      />
      <div className="space-y-5 p-4 sm:p-6 max-w-7xl mx-auto">
        <Link
          href={safeReturn(search.get('returnTo'))}
          className="text-sm underline underline-offset-4"
        >
          Back to suppliers
        </Link>
        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-background p-4">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border">
            {r.logoUrl ? (
              <Image
                src={r.logoUrl}
                alt=""
                width={48}
                height={48}
                unoptimized
                className="object-contain"
              />
            ) : r.supplierType === 'COMPANY' ? (
              <Building2 />
            ) : (
              <UserRound />
            )}
          </div>
          <div className="flex-1 min-w-48">
            <div className="flex flex-wrap items-center gap-2">
              <SupplierStage stage={r.stage} />
              <span className="text-xs text-muted-foreground">
                Account: {r.accountStatus?.replaceAll('_', ' ') || 'Not created'}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{nextStep(data, missing.length)}</p>
          </div>
          <div className="text-xs text-muted-foreground">Updated {dateTime(r.updatedAt)}</div>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive p-4 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-lg border p-4 text-sm">
            {notice}
          </p>
        )}
        <Tabs value={tab} onValueChange={setTab}>
          <div className="overflow-x-auto">
            <TabsList className="w-max">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
              {data.permissions.review && (
                <TabsTrigger value="history">Reviews & activity</TabsTrigger>
              )}
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              {data.permissions.review && (
                <TabsTrigger value="evidence">Source evidence</TabsTrigger>
              )}
            </TabsList>
          </div>
          <TabsContent value="overview" className="mt-5 space-y-5">
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="space-y-5">
                <Section
                  title={
                    data.approvedIdentity ? 'Approved supplier information' : 'Supplier information'
                  }
                >
                  <Fields
                    items={{
                      Name: overviewIdentity.name,
                      'Contact person': overviewIdentity.contactName,
                      Country: overviewIdentity.country,
                      Phone: overviewIdentity.phone || data.account?.phone,
                      Role: overviewIdentity.role,
                      'Account email': data.account?.email ?? r.email,
                      'Contact email': data.account?.contactEmail ?? r.email,
                      'Contact email verified':
                        data.account?.contactEmailVerified ?? a?.emailVerified ?? false,
                      'Emergency contact': data.account?.emergencyContact,
                    }}
                  />
                  <div className="mt-4">
                    <p className="text-xs font-medium text-muted-foreground">Website</p>
                    <p className="mt-1">
                      <SafeLink url={overviewIdentity.website} />
                    </p>
                  </div>
                </Section>
                <Section title="Capability summary">
                  <p className="text-sm whitespace-pre-wrap">
                    {data.capabilities.description || 'No capability description provided.'}
                  </p>
                  <div className="mt-5">
                    <Fields
                      items={{
                        Offerings: data.capabilities.offerings,
                        Domains: data.capabilities.domains,
                        Formats: data.capabilities.formats,
                        Modalities: data.capabilities.modalities,
                      }}
                    />
                  </div>
                </Section>
              </div>
              <div className="space-y-5">
                <Section title="Onboarding">
                  <Fields
                    items={{
                      Application:
                        a?.applicationStatus?.replaceAll('_', ' ') || 'Historical account',
                      Verification:
                        a?.verificationStatus?.replaceAll('_', ' ') ||
                        (data.account?.onboardingCompletedAt
                          ? 'Previously completed'
                          : 'Not completed'),
                      'Email verified': data.account?.emailVerified ?? a?.emailVerified ?? false,
                      'Verified profile since': dateTime(data.account?.onboardingCompletedAt),
                      Reviewer: r.reviewer?.name || 'Unassigned',
                    }}
                  />
                  {r.applicationId && data.permissions.review && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setTab('verification')}
                    >
                      Open review workspace
                    </Button>
                  )}
                </Section>
                <Section title="Offline contract">
                  <p className="text-sm">
                    {data.contract?.complete
                      ? 'Recorded as complete'
                      : data.contract
                        ? 'Pending'
                        : 'Available after account creation'}
                  </p>
                  {data.contract?.complete && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {dateTime(data.contract.completedAt)} ·{' '}
                      {data.contract.completedBy?.name || 'Admin not recorded'}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Contract completion is separate from onboarding verification and dataset
                    publication checks.
                  </p>
                  {data.permissions.review && data.contract && !data.contract.complete && (
                    <Button
                      className="mt-4"
                      variant="outline"
                      disabled={busy}
                      onClick={() => setContractConfirm(true)}
                    >
                      Record contract completion
                    </Button>
                  )}
                </Section>
              </div>
            </div>
            <Section title="Record references">
              <Fields
                items={{
                  'Application ID': r.applicationId,
                  'Supplier account ID': r.supplierId,
                  'Application source': data.source.source,
                  'Linked requirement': data.source.requirementRef,
                  'First recorded': dateTime(data.source.createdAt),
                  'Last login': dateTime(data.account?.lastLoginAt),
                }}
              />
            </Section>
          </TabsContent>
          <TabsContent value="capabilities" className="mt-5 space-y-5">
            <p className="text-sm text-muted-foreground">
              Current saved supplier declarations. Submitted versions and review decisions are
              retained under Reviews & activity.
            </p>
            <Section title="Offerings and coverage">
              <Fields
                items={{
                  Offerings: data.capabilities.offerings,
                  Domains: data.capabilities.domains,
                  Modalities: data.capabilities.modalities,
                  Formats: data.capabilities.formats,
                  'Geographic coverage': data.capabilities.countries,
                  Languages: data.capabilities.languages,
                }}
              />
            </Section>
            <Section title="Delivery capabilities">
              <Fields
                items={{
                  Description: data.capabilities.description,
                  'Collection methods': data.capabilities.collectionMethods,
                  'Capacity / inventory': data.capabilities.capacity,
                  Availability: data.capabilities.availability,
                  Equipment: data.capabilities.equipment,
                  Experience: data.capabilities.experience,
                }}
              />
            </Section>
            <Section title="Rights and compliance declarations">
              <Fields
                items={{
                  'Ownership and licensing': data.capabilities.rights,
                  Compliance: data.capabilities.compliance,
                  ...(data.permissions.review
                    ? { 'Additional supplier notes': data.capabilities.notes }
                    : {}),
                }}
              />
            </Section>
            <Section title="Portfolio references">
              <div className="space-y-3">
                {data.capabilities.portfolio ? (
                  data.capabilities.portfolio
                    .split('\n')
                    .filter(Boolean)
                    .map((url, i) => (
                      <p key={i}>
                        <SafeLink url={url} />
                      </p>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground">No portfolio provided.</p>
                )}
              </div>
            </Section>
          </TabsContent>
          <TabsContent value="verification" className="mt-5 space-y-5">
            {!data.permissions.review ? (
              <Section title="Verification access">
                <p className="text-sm">
                  Document evidence and review decisions require supplier verification permission.
                </p>
              </Section>
            ) : (
              <>
                {a ? (
                  <>
                    <Section
                      title={
                        current ? 'Submitted information under review' : 'Verification workspace'
                      }
                    >
                      <p className="text-sm text-muted-foreground">
                        {current
                          ? `Reviewing the fixed ${current.phase === 'APPLICATION' ? 'capability application' : 'verification'} submission, version ${current.version}.`
                          : 'No submission is currently awaiting a decision.'}
                      </p>
                      {a.reason && (
                        <p className="mt-4 rounded-md border p-3 text-sm">
                          Supplier feedback: {a.reason}
                        </p>
                      )}
                      {current && (
                        <details className="mt-4">
                          <summary className="cursor-pointer text-sm font-medium">
                            View exact submitted identity and capabilities
                          </summary>
                          <div className="mt-4 space-y-4">
                            <Fields items={identityFields(current.snapshot.identity)} />
                            <Fields items={capabilityFields(current.snapshot.capabilities)} />
                          </div>
                        </details>
                      )}
                      {a.userId && (
                        <div className="mt-5">
                          <Fields
                            items={{
                              'Legal name': (
                                current?.snapshot.verificationDetails ?? a.verificationDetails
                              ).legalName,
                              'Registration country': (
                                current?.snapshot.verificationDetails ?? a.verificationDetails
                              ).registrationCountry,
                              'Registration number': (
                                current?.snapshot.verificationDetails ?? a.verificationDetails
                              ).registrationNumber,
                              Address: (
                                current?.snapshot.verificationDetails ?? a.verificationDetails
                              ).address,
                              'Verification notes': (
                                current?.snapshot.verificationDetails ?? a.verificationDetails
                              ).notes,
                            }}
                          />
                        </div>
                      )}
                    </Section>
                    <Section title="Required documents">
                      <p className="mb-4 text-sm text-muted-foreground">
                        {a.userId
                          ? `${missing.length} required document slots missing. Opening a document does not approve it.`
                          : 'Documents are provided after the supplier accepts the invitation and creates their account.'}
                      </p>
                      <div className="divide-y">
                        {checklist.map((slot) => (
                          <div key={slot.key} className="py-4 first:pt-0">
                            <div className="flex flex-wrap justify-between gap-2">
                              <p className="text-sm font-medium">
                                {slot.label}{' '}
                                <span className="text-xs text-muted-foreground">
                                  · {slot.required ? 'Required' : 'Optional'}
                                </span>
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {documents.some((d) => d.requirementKey === slot.key)
                                  ? 'Submitted'
                                  : 'Not provided'}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {slot.acceptedAlternatives.join(' / ')}
                            </p>
                            {documents
                              .filter((d) => d.requirementKey === slot.key)
                              .map((d) => (
                                <Button
                                  key={d.id}
                                  variant="link"
                                  className="mt-2 h-auto whitespace-normal p-0 text-left"
                                  disabled={busy}
                                  onClick={() =>
                                    run(async () => {
                                      const link = await supplierApplications.document(a.id, d.id);
                                      openExternalUrl(link.url);
                                    }, 'Private verification document opened.')
                                  }
                                >
                                  <Download />
                                  {d.name} · {Math.ceil(d.size / 1024)} KB
                                </Button>
                              ))}
                          </div>
                        ))}
                      </div>
                    </Section>
                    <ReviewActions data={data} busy={busy} run={run} />
                  </>
                ) : (
                  <Section title="Historical onboarding">
                    <p className="text-sm">
                      {data.account?.onboardingCompletedAt
                        ? 'This supplier completed onboarding before the current application workflow.'
                        : 'No current application is linked to this account.'}{' '}
                      Existing records have been preserved.
                    </p>
                  </Section>
                )}
                {data.legacyManualKyc && (
                  <Section title="Historical manual verification">
                    <Fields
                      items={{
                        Status: data.legacyManualKyc.status,
                        Submitted: dateTime(data.legacyManualKyc.submittedAt),
                        'Reviewed by': data.legacyManualKyc.reviewer?.name,
                        Verified: dateTime(data.legacyManualKyc.verifiedAt),
                        Rejected: dateTime(data.legacyManualKyc.rejectedAt),
                        'Rejection reason': data.legacyManualKyc.rejectionReason,
                      }}
                    />
                  </Section>
                )}
              </>
            )}
          </TabsContent>
          {data.permissions.review && (
            <TabsContent value="history" className="mt-5 space-y-5">
              <Section title="Admin notes">
                <Label htmlFor="supplier-note">Add a private note</Label>
                <Textarea
                  id="supplier-note"
                  className="mt-2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={5000}
                  rows={3}
                  placeholder="Review findings, follow-up details or unresolved questions"
                />
                <Button
                  className="mt-3"
                  disabled={busy || note.trim().length < 3}
                  onClick={async () => {
                    if (
                      await run(
                        () => supplierWorkspace.note(r.recordId, note),
                        'Private admin note saved.'
                      )
                    )
                      setNote('');
                  }}
                >
                  Save note
                </Button>
                <div className="mt-5 space-y-4">
                  {notesEntries.map((e) => (
                    <article className="rounded-md border p-3" key={e.id}>
                      <p className="whitespace-pre-wrap break-words text-sm">{e.body}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {e.author.name} · {dateTime(e.createdAt)}
                      </p>
                    </article>
                  ))}
                </div>
                {notesQuery.isError && (
                  <p role="alert" className="mt-3 text-sm text-destructive">
                    {getFriendlyErrorMessage(notesQuery.error)}
                  </p>
                )}
                {notesQuery.hasNextPage && (
                  <Button
                    className="mt-4"
                    variant="outline"
                    disabled={notesQuery.isFetchingNextPage}
                    onClick={() => notesQuery.fetchNextPage()}
                  >
                    Load older notes
                  </Button>
                )}
              </Section>
              <Section title="Submission and decision history">
                {a?.reviews.length ? (
                  a.reviews.map((review) => (
                    <details className="border-b py-4 first:pt-0 last:border-0" key={review.id}>
                      <summary className="cursor-pointer text-sm font-medium">
                        {review.phase === 'APPLICATION' ? 'Capability application' : 'Verification'}{' '}
                        · version {review.version} ·{' '}
                        {review.decision?.replaceAll('_', ' ') || 'Awaiting review'}
                      </summary>
                      <div className="mt-4 space-y-5">
                        <Fields
                          items={{
                            Submitted: dateTime(review.submittedAt),
                            Reviewed: dateTime(review.reviewedAt),
                            'Reviewed by': data.reviewActors[review.id]?.name,
                            'Supplier-facing reason': review.reason,
                            'Internal review notes': review.internalNotes,
                          }}
                        />
                        <Fields items={identityFields(review.snapshot.identity)} />
                        <Fields items={capabilityFields(review.snapshot.capabilities)} />
                        {review.phase === 'VERIFICATION' && (
                          <>
                            <Fields
                              items={{
                                'Submitted legal name':
                                  review.snapshot.verificationDetails.legalName,
                                'Submitted address': review.snapshot.verificationDetails.address,
                                'Submitted registration number':
                                  review.snapshot.verificationDetails.registrationNumber,
                                'Submitted verification notes':
                                  review.snapshot.verificationDetails.notes,
                              }}
                            />
                            <p className="text-sm font-medium">Documents in this submission</p>
                            {review.snapshot.documents.map((d) => (
                              <p key={d.id}>
                                <Button
                                  variant="link"
                                  className="h-auto whitespace-normal p-0"
                                  disabled={busy}
                                  onClick={() =>
                                    run(
                                      async () =>
                                        openExternalUrl(
                                          (await supplierApplications.document(a.id, d.id)).url
                                        ),
                                      'Historical document opened.'
                                    )
                                  }
                                >
                                  <Download />
                                  {d.name}
                                </Button>
                              </p>
                            ))}
                          </>
                        )}
                      </div>
                    </details>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No application submissions recorded.
                  </p>
                )}
              </Section>
              <Section title="Activity timeline">
                <p className="mb-4 text-xs text-muted-foreground">
                  Recorded actions, newest first.
                </p>
                <ol className="space-y-4">
                  {activityEntries.map((e) => (
                    <li className="border-l-2 pl-4" key={e.id}>
                      <p className="text-sm font-medium">{e.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {e.action.replaceAll('_', ' ')} · {e.actor.name} · {dateTime(e.createdAt)}
                      </p>
                    </li>
                  ))}
                </ol>
                {activityQuery.isError && (
                  <p role="alert" className="mt-3 text-sm text-destructive">
                    {getFriendlyErrorMessage(activityQuery.error)}
                  </p>
                )}
                {activityQuery.hasNextPage && (
                  <Button
                    className="mt-4"
                    variant="outline"
                    disabled={activityQuery.isFetchingNextPage}
                    onClick={() => activityQuery.fetchNextPage()}
                  >
                    Load older activity
                  </Button>
                )}
              </Section>
              {a && (
                <Section title="Invitation and notification history">
                  <div className="mb-5 space-y-3">
                    {invitationEntries.map((invitation) => (
                      <article className="rounded-md border p-3 text-sm" key={invitation.id}>
                        <p className="font-medium">{invitation.state.replaceAll('_', ' ')}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Issued {dateTime(invitation.createdAt)} ·{' '}
                          {invitation.createdBy?.name ?? 'Admin not recorded'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Expires {dateTime(invitation.expiresAt)}
                          {invitation.acceptedAt
                            ? ` · Accepted ${dateTime(invitation.acceptedAt)}`
                            : invitation.revokedAt
                              ? ` · Revoked ${dateTime(invitation.revokedAt)}`
                              : ''}
                        </p>
                      </article>
                    ))}
                    {invitationQuery.hasNextPage && (
                      <Button
                        variant="outline"
                        disabled={invitationQuery.isFetchingNextPage}
                        onClick={() => invitationQuery.fetchNextPage()}
                      >
                        Load older invitations
                      </Button>
                    )}
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Completed means mail processing completed; inbox receipt is not tracked.
                  </p>
                  <div className="space-y-2">
                    {a.notifications?.map((n) => (
                      <p key={n.id} className="text-sm">
                        {n.deliveryState?.replaceAll('_', ' ') || 'Pending'} · queued{' '}
                        {dateTime(n.queuedAt)} · {n.attempts} enqueue attempts
                      </p>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4"
                    disabled={busy}
                    onClick={() =>
                      run(() => supplierApplications.retry(a.id), 'Notification retry requested.')
                    }
                  >
                    Retry failed notifications
                  </Button>
                </Section>
              )}
            </TabsContent>
          )}
          <TabsContent value="marketplace" className="mt-5 space-y-5">
            <Section title="Marketplace activity">
              {data.marketplace ? (
                <>
                  <Fields
                    items={{
                      Datasets: data.marketplace.datasetCount,
                      'Published datasets': data.marketplace.publishedDatasetCount,
                      'Custom services': data.marketplace.serviceCount,
                    }}
                  />
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="mb-3 text-sm font-medium">Recent datasets</p>
                      {data.marketplace.datasets.map((d) => (
                        <p key={d.id} className="mb-3 text-sm">
                          {can({
                            anyOf: [
                              'VIEW_DATASET_PROPOSALS',
                              'VIEW_ASSIGNED_DATASETS',
                              'APPROVE_DATASET',
                              'REJECT_DATASET',
                              'REQUEST_DATASET_CHANGES',
                            ],
                          }) ? (
                            <Link
                              className="underline underline-offset-4"
                              href={`/dashboard/datasets/${d.id}`}
                            >
                              {d.title}
                            </Link>
                          ) : (
                            d.title
                          )}
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {d.status.replaceAll('_', ' ')}
                          </span>
                        </p>
                      ))}
                    </div>
                    <div>
                      <p className="mb-3 text-sm font-medium">Recent custom services</p>
                      {data.marketplace.services.map((s) => (
                        <p key={s.id} className="mb-3 text-sm">
                          {can({ allOf: ['REVIEW_CUSTOM_COLLECTION_SERVICE'] }) ? (
                            <Link
                              className="underline underline-offset-4"
                              href={`/dashboard/custom-collection-services/${s.id}`}
                            >
                              {s.title}
                            </Link>
                          ) : (
                            s.title
                          )}
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {s.status.replaceAll('_', ' ')}
                          </span>
                        </p>
                      ))}
                    </div>
                  </div>
                  {data.permissions.analytics && r.supplierId && (
                    <Button asChild variant="outline" className="mt-5">
                      <Link href={`/dashboard/suppliers/${r.supplierId}/analytics`}>
                        View analytics & reports
                      </Link>
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Marketplace activity becomes available after account creation.
                </p>
              )}
            </Section>
          </TabsContent>
          {data.permissions.review && (
            <TabsContent value="evidence" className="mt-5 space-y-5">
              <Section title="Source references">
                <Fields
                  items={{
                    Source: data.source.source,
                    'External reference': data.source.importRef,
                    'Linked requirement': data.source.requirementRef,
                  }}
                />
                <p className="mt-4 text-xs text-muted-foreground">
                  Supporting evidence is private and separate from verification approval. Original
                  supplier claims remain subject to review.
                </p>
              </Section>
              <Section title="Attach supporting evidence">
                <p className="mb-4 text-sm text-muted-foreground">
                  Upload the original review export or supporting correspondence as JSON, text, PDF,
                  PNG or JPEG, up to 2 MB.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="supplier-evidence-file">Evidence file</Label>
                    <Input
                      id="supplier-evidence-file"
                      type="file"
                      accept=".json,.txt,.pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier-evidence-source">
                      Source reference URL (optional)
                    </Label>
                    <Input
                      id="supplier-evidence-source"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      maxLength={500}
                      placeholder="https://…"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="supplier-evidence-summary">Evidence summary</Label>
                    <Textarea
                      id="supplier-evidence-summary"
                      maxLength={500}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <Button
                  className="mt-4"
                  disabled={busy || !file || summary.trim().length < 3}
                  onClick={async () => {
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      setError('Choose supporting evidence up to 2 MB.');
                      return;
                    }
                    if (
                      await run(
                        () => supplierWorkspace.evidence(r.recordId, file, summary, sourceUrl),
                        'Supporting evidence stored privately.'
                      )
                    ) {
                      setFile(null);
                      setSummary('');
                      setSourceUrl('');
                      const field = document.getElementById(
                        'supplier-evidence-file'
                      ) as HTMLInputElement | null;
                      if (field) field.value = '';
                    }
                  }}
                >
                  Store private evidence
                </Button>
              </Section>
              <Section title="Evidence library">
                {evidenceEntries.length ? (
                  evidenceEntries.map((e) => (
                    <article
                      key={e.id}
                      className="space-y-2 border-b py-4 first:pt-0 last:border-0"
                    >
                      <Button
                        variant="link"
                        className="h-auto whitespace-normal p-0 text-left"
                        disabled={busy}
                        onClick={() => downloadEvidence(e.id)}
                      >
                        <Download />
                        {e.name}
                      </Button>
                      <p className="whitespace-pre-wrap text-sm">{e.body}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.author.name} · {dateTime(e.createdAt)} ·{' '}
                        {Math.ceil((e.size ?? 0) / 1024)} KB
                      </p>
                      {e.sourceUrl && (
                        <SafeLink url={e.sourceUrl} label="Original source reference" />
                      )}
                      <details>
                        <summary className="cursor-pointer text-xs text-muted-foreground">
                          File checksum
                        </summary>
                        <p className="mt-2 break-all font-mono text-xs">{e.sha256}</p>
                      </details>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No source files attached yet.</p>
                )}
                {evidenceQuery.isError && (
                  <p role="alert" className="mt-3 text-sm text-destructive">
                    {getFriendlyErrorMessage(evidenceQuery.error)}
                  </p>
                )}
                {evidenceQuery.hasNextPage && (
                  <Button
                    className="mt-4"
                    variant="outline"
                    disabled={evidenceQuery.isFetchingNextPage}
                    onClick={() => evidenceQuery.fetchNextPage()}
                  >
                    Load older evidence
                  </Button>
                )}
              </Section>
            </TabsContent>
          )}
        </Tabs>
      </div>
      <Dialog open={contractConfirm} onOpenChange={setContractConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record offline contract completion</DialogTitle>
            <DialogDescription>
              Confirm that the signed contract for {r.name} has been reviewed. This records your
              admin identity and notifies the supplier. Onboarding and dataset publication
              requirements remain separate.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setContractConfirm(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                if (
                  r.supplierId &&
                  (await run(
                    () => markOfflineContractDone(r.supplierId!),
                    'Contract completion recorded.'
                  ))
                )
                  setContractConfirm(false);
              }}
            >
              <CheckCircle2 />
              Confirm completion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function nextStep(data: SupplierAdminWorkspace, missing: number) {
  const stage = data.record.stage;
  if (stage === 'APPROVED')
    return 'Onboarding verification complete. Dataset publication has its own checks.';
  if (stage === 'INVITED')
    return 'Waiting for the supplier to accept their invitation and set up their account.';
  if (stage === 'INVITATION_EXPIRED' || stage === 'INVITATION_REVOKED')
    return 'A replacement invitation is needed before account setup.';
  if (stage.includes('SUBMITTED'))
    return 'Submitted information is awaiting an admin review decision.';
  if (stage === 'VERIFICATION_DRAFT' || stage === 'CHANGES_REQUESTED')
    return `Waiting for the supplier to complete verification${data.permissions.review ? ` · ${missing} required document slots missing` : ''}.`;
  return stageLabels[stage] ?? 'Review the supplier record for the next step.';
}
const identityFields = (v: SupplierAdminWorkspace['identity']) => ({
  Name: v.name,
  Contact: v.contactName,
  Type: v.supplierType,
  Country: v.country,
  Phone: v.phone,
  Website: v.website,
  Role: v.role,
});
const capabilityFields = (v: SupplierAdminWorkspace['capabilities']) => ({
  Offerings: v.offerings,
  Domains: v.domains,
  Modalities: v.modalities,
  Formats: v.formats,
  Countries: v.countries,
  Languages: v.languages,
  Description: v.description,
  'Collection methods': v.collectionMethods,
  Capacity: v.capacity,
  Availability: v.availability,
  Equipment: v.equipment,
  Experience: v.experience,
  Rights: v.rights,
  Compliance: v.compliance,
  Portfolio: v.portfolio,
  Notes: v.notes,
});

type Run = (action: () => Promise<unknown>, message: string) => Promise<boolean>;
function ReviewActions({
  data,
  busy,
  run,
}: {
  data: SupplierAdminWorkspace;
  busy: boolean;
  run: Run;
}) {
  const { user } = useAuthorization(),
    a = data.review!;
  const current = a.reviews.find((r) => !r.decision);
  const [reason, setReason] = useState(''),
    [notes, setNotes] = useState(''),
    [date, setDate] = useState('');
  const [confirm, setConfirm] = useState<
    SupplierReviewDecision['decision'] | 'resend' | 'revoke' | 'reopen' | null
  >(null);
  const owned = !!current?.pickedByAdminId && current.pickedByAdminId === user?.id;
  const blocked = !!current?.pickedByAdminId && !owned;
  const required =
    !!confirm && ['REQUEST_INFORMATION', 'REQUEST_CHANGES', 'REJECT'].includes(confirm);
  const invitationState = a.invitation?.acceptedAt
    ? 'Accepted'
    : a.invitation?.revokedAt
      ? 'Revoked'
      : a.invitation && new Date(a.invitation.expiresAt) <= new Date()
        ? 'Expired'
        : a.invitation
          ? 'Awaiting acceptance'
          : 'Not issued';
  async function submit() {
    if (!confirm) return;
    const action = confirm;
    const success = await run(() => {
      if (action === 'resend' || action === 'revoke')
        return supplierApplications.action(a.id, 'invitation/' + action, { version: a.version });
      if (action === 'reopen')
        return supplierApplications.action(a.id, 'reopen', { version: a.version });
      return supplierApplications.decision(a.id, {
        version: a.version,
        reviewId: current!.id,
        decision: action,
        reason,
        internalNotes: notes,
        ...(action === 'REJECT' && date
          ? { reapplyAt: new Date(`${date}T23:59:59Z`).toISOString() }
          : {}),
      });
    }, 'Action recorded. Any resulting notification is tracked under Reviews & activity.');
    setConfirm(null);
    if (success) {
      setReason('');
      setNotes('');
    }
  }
  return (
    <Section title="Review actions">
      <div className="space-y-4">
        {current ? (
          <>
            <p className="text-sm text-muted-foreground">
              {blocked
                ? 'Another admin has picked this submission.'
                : owned
                  ? 'You are reviewing this submission.'
                  : 'Pick this submission before recording a decision.'}
            </p>
            {!owned && (
              <Button
                variant="outline"
                disabled={busy || blocked}
                onClick={() =>
                  run(
                    () => supplierApplications.action(a.id, 'pick', { version: a.version }),
                    'Submission assigned to you.'
                  )
                }
              >
                Pick submission
              </Button>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="review-feedback">Supplier-facing feedback</Label>
                <Textarea
                  id="review-feedback"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={2000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-private-notes">Private decision notes</Label>
                <Textarea
                  id="review-private-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={3000}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(current.phase === 'APPLICATION'
                ? (['INVITE', 'REQUEST_INFORMATION', 'REJECT'] as const)
                : (['APPROVE', 'REQUEST_CHANGES', 'REJECT'] as const)
              ).map((action) => (
                <Button
                  key={action}
                  variant={action === 'REJECT' ? 'destructive' : 'outline'}
                  disabled={busy || !owned || (action === 'INVITE' && !data.permissions.invite)}
                  onClick={() => setConfirm(action)}
                >
                  {
                    {
                      INVITE: 'Invite supplier',
                      REQUEST_INFORMATION: 'Request information',
                      REJECT: 'Reject',
                      APPROVE: 'Approve verification',
                      REQUEST_CHANGES: 'Request changes',
                    }[action]
                  }
                </Button>
              ))}
            </div>
          </>
        ) : (
          <>
            {a.applicationStatus === 'INVITED' && !a.userId && (
              <>
                <Fields
                  items={{
                    Invitation: invitationState,
                    Expires: dateTime(a.invitation?.expiresAt),
                  }}
                />
                {data.permissions.invite && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" disabled={busy} onClick={() => setConfirm('resend')}>
                      Replace and resend invitation
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy || !!a.invitation?.revokedAt}
                      onClick={() => setConfirm('revoke')}
                    >
                      Revoke invitation
                    </Button>
                  </div>
                )}
              </>
            )}
            {(a.userId ? a.verificationStatus : a.applicationStatus) === 'REJECTED' && (
              <Button variant="outline" disabled={busy} onClick={() => setConfirm('reopen')}>
                Reopen for corrections
              </Button>
            )}
            {!current &&
              a.applicationStatus !== 'INVITED' &&
              (a.userId ? a.verificationStatus : a.applicationStatus) !== 'REJECTED' && (
                <p className="text-sm text-muted-foreground">
                  No review decision is available at this stage.
                </p>
              )}
          </>
        )}
      </div>
      <Dialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!busy && !open) setConfirm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {confirm?.toLowerCase().replaceAll('_', ' ')}</DialogTitle>
            <DialogDescription>
              This action applies to {data.record.name} ({a.email}).{' '}
              {confirm === 'resend'
                ? 'A new secure invitation will be emailed and the previous unused link will be revoked.'
                : confirm === 'revoke'
                  ? 'The current unused invitation link will stop working.'
                  : 'The action and your admin identity will be recorded. Supplier-facing feedback may be emailed.'}
            </DialogDescription>
          </DialogHeader>
          {required && reason.trim().length < 3 && (
            <p role="alert" className="text-sm text-destructive">
              Add actionable supplier-facing feedback before confirming.
            </p>
          )}
          {confirm === 'REJECT' && (
            <div className="space-y-2">
              <Label htmlFor="review-reapply">Eligible reapplication date (optional)</Label>
              <Input
                id="review-reapply"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button disabled={busy || (required && reason.trim().length < 3)} onClick={submit}>
              Confirm action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
