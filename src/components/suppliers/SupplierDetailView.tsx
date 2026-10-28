'use client';
import { SupplierWorkspaceView } from './SupplierWorkspaceView';
export function SupplierDetailView({ supplierId }: { supplierId: string }) {
  return <SupplierWorkspaceView recordId={`account:${supplierId}`} />;
}
