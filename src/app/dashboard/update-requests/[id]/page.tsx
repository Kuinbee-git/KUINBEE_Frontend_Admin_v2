"use client";

import { useParams } from "next/navigation";
import { DatasetDetailReview } from "@/components/datasets/DatasetDetailReview";

export default function UpdateRequestDetailPage() {
  const params = useParams();
  const datasetId = params.id as string;

  return <DatasetDetailReview datasetId={datasetId} queueType="update-requests" />;
}
