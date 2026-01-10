"use client";

import { memo, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

type SignalStatus = "warning" | "info" | "error" | "success";

interface SignalCardProps {
  label: string;
  count: number;
  status: SignalStatus;
  icon: LucideIcon;
  onClick: () => void;
}

const getStatusStyles = (status: SignalStatus) => {
  switch (status) {
    case "warning":
      return {
        color: "var(--state-warning)",
        bgColor: "rgba(245, 158, 11, 0.08)",
        borderColor: "rgba(245, 158, 11, 0.2)",
      };
    case "info":
      return {
        color: "var(--state-info)",
        bgColor: "rgba(56, 189, 248, 0.08)",
        borderColor: "rgba(56, 189, 248, 0.2)",
      };
    case "error":
      return {
        color: "var(--state-error)",
        bgColor: "rgba(239, 68, 68, 0.08)",
        borderColor: "rgba(239, 68, 68, 0.2)",
      };
    case "success":
      return {
        color: "var(--state-success)",
        bgColor: "rgba(16, 185, 129, 0.08)",
        borderColor: "rgba(16, 185, 129, 0.2)",
      };
  }
};

function SignalCardComponent({ label, count, status, icon: Icon, onClick }: SignalCardProps) {
  const styles = useMemo(() => getStatusStyles(status), [status]);

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg"
      style={{
        backgroundColor: styles.bgColor,
        borderColor: styles.borderColor,
      }}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className="p-2 rounded-lg"
            style={{
              backgroundColor: styles.bgColor,
            }}
          >
            <Icon className="h-4 w-4" style={{ color: styles.color }} />
          </div>
        </div>
        <div className="text-3xl font-semibold mb-1" style={{ color: styles.color }}>
          {count}
        </div>
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {label}
        </div>
      </CardContent>
    </Card>
  );
}

export const SignalCard = memo(SignalCardComponent);
