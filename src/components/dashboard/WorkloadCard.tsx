"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface WorkloadCardProps {
  label: string;
  count: number;
  onClick?: () => void;
}

function WorkloadCardComponent({ label, count, onClick }: WorkloadCardProps) {
  return (
    <Card
      className={`hover:shadow-md transition-all ${onClick ? "cursor-pointer" : ""}`}
      style={{
        backgroundColor: "var(--bg-base)",
        borderColor: "var(--border-default)",
      }}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="text-2xl font-semibold mb-1" style={{ color: "var(--state-info)" }}>
          {count}
        </div>
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {label}
        </div>
      </CardContent>
    </Card>
  );
}

export const WorkloadCard = memo(WorkloadCardComponent);
