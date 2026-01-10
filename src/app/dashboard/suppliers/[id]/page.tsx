"use client";

import { useParams } from "next/navigation";
import { SupplierDetail } from "@/components/suppliers/SupplierDetail";

export default function SupplierDetailPage() {
  const params = useParams();
  const supplierId = params.id as string;

  return <SupplierDetail supplierId={supplierId} />;
}
