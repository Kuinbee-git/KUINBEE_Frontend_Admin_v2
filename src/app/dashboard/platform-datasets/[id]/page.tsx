"use client";

import { useParams } from "next/navigation";
import { PlatformDatasetDetail } from "@/components/datasets/PlatformDatasetDetail";

export default function PlatformDatasetDetailPage() {
  const params = useParams();
  const datasetId = params.id as string;
  
  return <PlatformDatasetDetail datasetId={datasetId} />;
}
