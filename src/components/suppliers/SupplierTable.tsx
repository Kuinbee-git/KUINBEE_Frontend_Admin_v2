'use client';

import { CheckCircle2, Building2, User, ChevronRight } from 'lucide-react';
import { StatusBadge, formatStatusLabel, formatEnumLabel } from '@/components/shared/StatusBadge';
import { DataTable, type ColumnDef } from '@/components/shared/DataTable';
import { SUPPLIER_VERIFICATION } from '@/lib/supplier-verification';
import type { SupplierListItem } from '@/types';

interface SupplierTableProps {
  suppliers: SupplierListItem[];
  onRowClick: (supplierId: string) => void;
}

export function SupplierTable({ suppliers, onRowClick }: SupplierTableProps) {
  const columns: ColumnDef<SupplierListItem>[] = [
    {
      header: 'Supplier',
      render: ({ supplier, supplierProfile: p, country }) => {
        const Icon = p.supplierType === 'COMPANY' ? Building2 : User;
        return (
          <div className="flex min-w-52 max-w-80 items-start gap-3">
            <div
              className="rounded-md border p-2"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="font-medium whitespace-normal" style={{ color: 'var(--text-primary)' }}>
                {(p.supplierType === 'COMPANY' ? p.companyName : p.individualName) ||
                  supplier.email}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {[formatEnumLabel(p.supplierType), country].filter(Boolean).join(' · ')}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Joined{' '}
                {new Date(supplier.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Capabilities',
      render: ({ capabilities }) => {
        const domains = capabilities?.domains ?? [];
        const services = capabilities?.offerings ?? [];
        const formats = capabilities?.formats ?? [];
        return (
          <div className="min-w-48 max-w-72 space-y-2 whitespace-normal">
            {domains.length ? (
              <div className="flex flex-wrap gap-1">
                {domains.slice(0, 2).map((domain) => (
                  <span
                    key={domain}
                    className="rounded border px-2 py-0.5 text-xs"
                    style={{
                      borderColor: 'var(--border-default)',
                      backgroundColor: 'var(--bg-surface)',
                    }}
                  >
                    {/^[A-Z_]+$/.test(domain) ? formatEnumLabel(domain) : domain}
                  </span>
                ))}
                {domains.length > 2 && (
                  <span className="text-xs" title={domains.slice(2).join(', ')}>
                    +{domains.length - 2}
                  </span>
                )}
              </div>
            ) : null}
            {services.length ? (
              <p className="line-clamp-2 text-xs" title={services.join(', ')}>
                {services.join(', ')}
              </p>
            ) : null}
            {formats.length ? (
              <p
                className="line-clamp-1 text-xs"
                style={{ color: 'var(--text-muted)' }}
                title={formats.join(', ')}
              >
                {formats.join(' · ')}
              </p>
            ) : null}
            {!domains.length && !services.length && !formats.length ? (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Not provided
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      header: 'Contact',
      render: ({ supplier, supplierProfile: p }) => (
        <div className="min-w-44 max-w-64 space-y-1">
          {p.contactPersonName && <p className="text-sm">{p.contactPersonName}</p>}
          <div className="flex items-start gap-2">
            <span className="break-all text-xs">{p.contactEmail || supplier.email}</span>
            {p.contactEmailVerified && (
              <CheckCircle2
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: 'var(--status-success)' }}
                aria-label="Contact email verified"
              />
            )}
          </div>
          {!p.contactEmailVerified && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Email unverified
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Account status',
      render: ({ supplier }) => (
        <StatusBadge
          status={formatStatusLabel(supplier.status)}
          semanticType={
            supplier.status === 'ACTIVE'
              ? 'success'
              : supplier.status === 'SUSPENDED'
                ? 'error'
                : 'neutral'
          }
        />
      ),
    },
    {
      header: 'Verification status',
      render: ({ verification }) => {
        const state =
          SUPPLIER_VERIFICATION[verification?.status] ?? SUPPLIER_VERIFICATION.NOT_RECORDED;
        return (
          <div className="space-y-1">
            <StatusBadge status={state.label} semanticType={state.semantic} />
            {verification?.source === 'MANUAL' && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Manual review
              </p>
            )}
            {verification?.source === 'HISTORICAL' && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Previously completed
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: 'Contract',
      render: ({ supplierProfile }) => (
        <div className="flex items-center justify-between gap-6">
          <StatusBadge
            status={supplierProfile.isOfflineContractDone ? 'Completed' : 'Pending'}
            semanticType={supplierProfile.isOfflineContractDone ? 'success' : 'pending'}
          />
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </div>
      ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      data={suppliers}
      onRowClick={(item) => onRowClick(item.supplier.id)}
      ariaLabel="Suppliers"
      getRowLabel={(item) => `Open supplier ${item.supplier.email}`}
      getRowKey={(item) => item.supplier.id}
      emptyMessage="No suppliers found"
    />
  );
}
