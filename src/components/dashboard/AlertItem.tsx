"use client";

import { memo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface AlertItemProps {
  message: string;
}

function AlertItemComponent({ message }: AlertItemProps) {
  return (
    <Alert
      style={{
        backgroundColor: "rgba(245, 158, 11, 0.08)",
        borderColor: "rgba(245, 158, 11, 0.3)",
      }}
    >
      <AlertCircle className="h-4 w-4" style={{ color: "var(--state-warning)" }} />
      <AlertDescription className="text-sm" style={{ color: "var(--text-primary)" }}>
        {message}
      </AlertDescription>
    </Alert>
  );
}

export const AlertItem = memo(AlertItemComponent);
