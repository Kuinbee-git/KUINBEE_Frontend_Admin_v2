import { Suspense } from 'react';
import { CustomCollectionLeadsView } from '@/components/custom-collection/CustomCollectionLeadsView';

export default function CustomCollectionLeadsPage() {
  return (
    <Suspense fallback={<main className="p-6">Loading leads…</main>}>
      <CustomCollectionLeadsView />
    </Suspense>
  );
}
