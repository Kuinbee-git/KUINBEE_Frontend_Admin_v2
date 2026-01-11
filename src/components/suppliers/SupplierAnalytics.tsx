"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Download,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupplier, useSupplierAnalytics } from "@/hooks";

interface SupplierAnalyticsProps {
  supplierId: string;
}

export function SupplierAnalytics({ supplierId }: SupplierAnalyticsProps) {
  const router = useRouter();
  const [windowDays, setWindowDays] = useState<number>(30);
  
  const { data: supplier, isLoading: isLoadingSupplier } = useSupplier(supplierId);
  const { data: analytics, isLoading: isLoadingAnalytics } = useSupplierAnalytics(supplierId, { windowDays });

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (isLoadingSupplier || isLoadingAnalytics) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-surface)" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading analytics...</p>
      </div>
    );
  }

  if (!supplier || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-surface)" }}>
        <p style={{ color: "var(--text-muted)" }}>Analytics not available</p>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Datasets",
      value: analytics.totals.datasetCount,
      icon: Package,
      color: "var(--brand-primary)",
      bgColor: "var(--bg-surface)",
    },
    {
      title: "Published Datasets",
      value: analytics.totals.publishedDatasetCount,
      icon: TrendingUp,
      color: "var(--status-success)",
      bgColor: "var(--status-success-bg)",
    },
    {
      title: "Total Orders",
      value: analytics.totals.orderCount,
      icon: ShoppingCart,
      color: "var(--status-info)",
      bgColor: "var(--status-info-bg)",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(analytics.totals.revenue),
      icon: DollarSign,
      color: "var(--status-warning)",
      bgColor: "var(--status-warning-bg)",
      isFormatted: true,
    },
    {
      title: "Total Downloads",
      value: analytics.totals.downloadCount,
      icon: Download,
      color: "var(--text-muted)",
      bgColor: "var(--bg-surface)",
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-surface)" }}>
      {/* Header */}
      <div
        className="p-6 border-b"
        style={{
          backgroundColor: "var(--bg-base)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/suppliers/${supplierId}`)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Supplier Details
          </Button>

          <Select
            value={windowDays.toString()}
            onValueChange={(value) => setWindowDays(parseInt(value))}
          >
            <SelectTrigger className="w-45">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="60">Last 60 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="180">Last 6 Months</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Supplier Info */}
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Analytics & Reports
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Performance metrics for{" "}
            <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
              {supplier.supplierProfile.supplierType === "COMPANY"
                ? supplier.supplierProfile.companyName
                : supplier.supplierProfile.individualName}
            </span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Showing data for the last {windowDays} days
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                style={{
                  backgroundColor: "var(--bg-base)",
                  borderColor: "var(--border-default)",
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                        {stat.isFormatted ? stat.value : formatNumber(stat.value as number)}
                      </p>
                    </div>
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: stat.bgColor,
                      }}
                    >
                      <Icon className="w-6 h-6" style={{ color: stat.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <Card
          className="mt-6"
          style={{
            backgroundColor: "var(--bg-base)",
            borderColor: "var(--border-default)",
          }}
        >
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>
              Key insights for the selected time period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
                <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  Publication Rate
                </label>
                <p className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
                  {analytics.totals.datasetCount > 0
                    ? Math.round((analytics.totals.publishedDatasetCount / analytics.totals.datasetCount) * 100)
                    : 0}%
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {analytics.totals.publishedDatasetCount} of {analytics.totals.datasetCount} datasets published
                </p>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
                <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  Average Revenue per Order
                </label>
                <p className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
                  {analytics.totals.orderCount > 0
                    ? formatCurrency((parseFloat(analytics.totals.revenue) / analytics.totals.orderCount).toString())
                    : formatCurrency("0")}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Based on {analytics.totals.orderCount} orders
                </p>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
                <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  Downloads per Order
                </label>
                <p className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
                  {analytics.totals.orderCount > 0
                    ? (analytics.totals.downloadCount / analytics.totals.orderCount).toFixed(2)
                    : "0.00"}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Average downloads per order
                </p>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
                <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  Revenue per Dataset
                </label>
                <p className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
                  {analytics.totals.publishedDatasetCount > 0
                    ? formatCurrency((parseFloat(analytics.totals.revenue) / analytics.totals.publishedDatasetCount).toString())
                    : formatCurrency("0")}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Average per published dataset
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
