
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent } from "@/components/ui/card";
import MetricCard from "@/components/analytics/MetricCard";
import { ShoppingCart, CreditCard, BarChart } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    totalOrders: number;
    totalSpent: number;
    totalRefundedVat: number;
    currency: string;
  };
  isLoading: boolean;
}

const DashboardStats = ({ stats, isLoading }: DashboardStatsProps) => {
  const { t } = useTranslation();

  // Format currency amounts
  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="h-28">
            <CardContent className="p-6">
              <div className="h-full w-full animate-pulse bg-muted rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        title={t("total_orders")}
        value={stats.totalOrders.toString()}
        icon={ShoppingCart}
      />
      <MetricCard
        title={t("total_spent")}
        value={formatCurrency(stats.totalSpent, stats.currency)}
        icon={CreditCard}
      />
      <MetricCard
        title={t("total_refunded_vat")}
        value={formatCurrency(stats.totalRefundedVat, stats.currency)}
        icon={BarChart}
      />
    </div>
  );
};

export default DashboardStats;
