"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { SignalCard } from "@/components/dashboard/SignalCard";
import { WorkloadCard } from "@/components/dashboard/WorkloadCard";
import { AlertItem } from "@/components/dashboard/AlertItem";
import { Clock, CheckCircle, XCircle, FileWarning, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  
  // Memoize data arrays to prevent recreation on every render
  const marketplaceSignals = useMemo(() => [
    {
      label: "Pending Review",
      count: 12,
      status: "warning" as const,
      icon: Clock,
      onClick: () => router.push("/dashboard/datasets?status=pending"),
    },
    {
      label: "Under Review",
      count: 8,
      status: "info" as const,
      icon: FileWarning,
      onClick: () => router.push("/dashboard/datasets?status=under-review"),
    },
    {
      label: "Changes Requested",
      count: 5,
      status: "error" as const,
      icon: XCircle,
      onClick: () => router.push("/dashboard/datasets?status=changes-requested"),
    },
    {
      label: "Published (Last 7d)",
      count: 23,
      status: "success" as const,
      icon: CheckCircle,
      onClick: () => router.push("/dashboard/datasets?status=published&days=7"),
    },
    {
      label: "Overdue Reviews",
      count: 3,
      status: "error" as const,
      icon: AlertCircle,
      onClick: () => router.push("/dashboard/datasets?status=overdue"),
    },
  ], [router]);

  // Memoize personal workload data
  const personalWorkload = useMemo(() => [
    { 
      label: "Assigned to me", 
      count: 4,
      onClick: () => router.push("/dashboard/datasets?assigned=me")
    },
    { 
      label: "Unassigned datasets", 
      count: 7,
      onClick: () => router.push("/dashboard/datasets?assigned=none")
    },
    { 
      label: "Completed today", 
      count: 2,
      onClick: () => router.push("/dashboard/datasets?completed=today")
    },
  ], [router]);

  // Memoize alerts data
  const alerts = useMemo(() => [
    "Pending review queue growing: 12 datasets awaiting assignment",
    "SLA breach warning: 3 datasets overdue for review",
    "Supplier quality alert: DataCorp International has 2 consecutive rejections",
  ], []);

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 style={{ color: "var(--text-primary)" }} className="mb-2">
          Dashboard
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          Marketplace status overview and attention signals
        </p>
      </div>

      {/* Section 1: Marketplace Signals */}
      <div className="mb-8">
        <h2 style={{ color: "var(--text-primary)" }} className="mb-4">
          Marketplace Signals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {marketplaceSignals.map((signal, index) => (
            <SignalCard key={index} {...signal} />
          ))}
        </div>
      </div>

      {/* Section 2: Personal Workload Snapshot */}
      <div className="mb-8">
        <h2 style={{ color: "var(--text-primary)" }} className="mb-4">
          Personal Workload
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {personalWorkload.map((item, index) => (
            <WorkloadCard key={index} {...item} />
          ))}
        </div>
      </div>

      {/* Section 3: Alerts & Attention Required */}
      <div>
        <h2 style={{ color: "var(--text-primary)" }} className="mb-4">
          Alerts & Attention Required
        </h2>
        <Card
          style={{
            backgroundColor: "var(--bg-base)",
            borderColor: "var(--border-default)",
          }}
        >
          <CardContent className="p-5">
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <AlertItem key={index} message={alert} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
