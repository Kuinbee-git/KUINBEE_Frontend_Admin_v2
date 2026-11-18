import { DatasetDetailReview } from '@/components/datasets/DatasetDetailReview';

export default async function SupplierDatasetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DatasetDetailReview datasetId={id} />;
}
