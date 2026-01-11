import { SupplierAnalytics } from "@/components/suppliers/SupplierAnalytics";
import { use } from "react";

interface PageProps {
  params: Promise<{
    supplierId: string;
  }>;
}

export default function SupplierAnalyticsPage({ params }: PageProps) {
  const { supplierId } = use(params);
  return <SupplierAnalytics supplierId={supplierId} />;
}
