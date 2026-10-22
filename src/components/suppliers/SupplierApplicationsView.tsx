'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supplierApplications, type ApplicationRow } from '@/services/supplier-applications.service';

export function SupplierApplicationsView() {
  const [rows, setRows] = useState<ApplicationRow[]>([]); const [q, setQ] = useState(''); const [phase, setPhase] = useState('APPLICATION');
  const [state, setState] = useState('SUBMITTED'); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {setLoading(true);setError('');supplierApplications.list({q, page, phase, state: state || undefined}).then(result => {
      if (active) {setRows(result.items);setTotal(result.total);}
    }).catch(err => {if (active) setError(err.message || 'Could not load applications');}).finally(() => {if (active) setLoading(false);});}, 250);
    return () => {active = false;clearTimeout(timer);};
  }, [q, phase, state, page, refresh]);
  const options = phase === 'APPLICATION' ? ['DRAFT', 'SUBMITTED', 'INFORMATION_REQUESTED', 'INVITED', 'REJECTED'] : ['DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED'];
  return <div className="space-y-6 p-4 md:p-8"><div><h1 className="text-2xl font-semibold">Supplier applications</h1><p className="mt-2 text-sm text-muted-foreground">Qualify applications, issue secure invitations and review submitted verification evidence.</p></div>
    <Card><CardHeader><CardTitle role="heading" aria-level={2}>Review queue</CardTitle><CardDescription>Application qualification and final verification are separate decisions.</CardDescription></CardHeader><CardContent>
      <div className="grid gap-4 md:grid-cols-3 mb-6"><label htmlFor="supplier-application-phase" className="text-sm space-y-2"><span>Review stage</span><select id="supplier-application-phase" aria-label="Review stage" className="w-full rounded-md border p-2 bg-background" value={phase} onChange={e => {setPhase(e.target.value);setState('SUBMITTED');setPage(1);}}><option value="APPLICATION">Application qualification</option><option value="VERIFICATION">Supplier verification</option></select></label>
        <label htmlFor="supplier-application-status" className="text-sm space-y-2"><span>Status</span><select id="supplier-application-status" aria-label="Status" className="w-full rounded-md border p-2 bg-background" value={state} onChange={e => {setState(e.target.value);setPage(1);}}><option value="">All statuses</option>{options.map(option => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}</select></label>
        <label htmlFor="supplier-application-search" className="text-sm space-y-2"><span>Search capabilities / email</span><Input id="supplier-application-search" value={q} onChange={e => {setQ(e.target.value);setPage(1);}} placeholder="Name, email, domain, modality or country"/></label></div>
      {error && <p role="alert" className="text-destructive mb-4">{error}</p>}{loading ? <p role="status">Loading applications…</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Applicant</th><th className="p-3">Capabilities</th><th className="p-3">Status</th><th className="p-3">Updated</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-b"><td className="p-3"><Link className="font-medium underline underline-offset-4" href={`/dashboard/supplier-applications/${row.id}`}>{row.identity.name || row.email}</Link><p className="text-muted-foreground mt-1">{row.email}</p><p className="text-muted-foreground">{row.identity.supplierType} · {row.identity.country || 'Country not supplied'}</p></td><td className="p-3 max-w-sm"><p>{row.capabilities.offerings.join(', ')}</p><p className="text-muted-foreground mt-1">{row.capabilities.domains.join(', ')} · {row.capabilities.modalities.join(', ')}</p></td><td className="p-3">{(row.userId ? row.verificationStatus : row.applicationStatus).replaceAll('_', ' ')}</td><td className="p-3">{new Date(row.updatedAt).toLocaleDateString()}</td></tr>)}</tbody></table>{rows.length === 0 && <p className="py-10 text-center text-muted-foreground">No applications match these filters.</p>}</div>}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{total} applications · page {page}</p><div className="flex gap-2"><Button variant="outline" onClick={() => setRefresh(v => v + 1)}>Refresh</Button><Button variant="outline" disabled={page === 1 || loading} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="outline" disabled={page * 20 >= total || loading} onClick={() => setPage(page + 1)}>Next</Button></div></div>
    </CardContent></Card></div>;
}
