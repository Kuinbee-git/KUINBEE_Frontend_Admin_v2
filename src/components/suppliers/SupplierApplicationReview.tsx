'use client';
import { SupplierWorkspaceView } from './SupplierWorkspaceView';
export function SupplierApplicationReview({ id }: { id: string }) {
  return <SupplierWorkspaceView recordId={`application:${id}`} />;
}
