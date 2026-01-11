import { SupplierDetailView } from "@/components/suppliers/SupplierDetailView";
import { use } from "react";

interface SupplierDetailPageProps {
  params: Promise<{
    supplierId: string;
  }>;
}

export default function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  const { supplierId } = use(params);
  return <SupplierDetailView supplierId={supplierId} />;
}
