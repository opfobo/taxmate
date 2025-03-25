
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import MetricCard from "@/components/analytics/MetricCard";
import SupplierTable from "@/components/analytics/SupplierTable";
import RevenueChart from "@/components/analytics/RevenueChart";
import OrderVolumeChart from "@/components/analytics/OrderVolumeChart";
import { AlertCircle, DollarSign, ShoppingCart, TrendingUp, CreditCard } from "lucide-react";

// Define types for the analytics data
interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  type: "purchase" | "refund" | "payout";
  status: "success" | "pending" | "failed";
}

interface Order {
  id: string;
  supplier_id: string;
  amount: number;
  order_date: string;
  currency: string;
  status: string;
}

interface Supplier {
  id: string;
  name: string;
  order_count: number;
  total_spend: number;
  currency: string;
}

interface RevenueData {
  date: string;
  value: number;
}

interface OrderVolumeData {
  date: string;
  value: number;
}

const AnalyticsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [currency, setCurrency] = useState("EUR"); // Default currency
  
  // Fetch user's preferred currency
  useQuery({
    queryKey: ["user", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("users")
        .select("currency")
        .eq("id", user.id)
        .single();
        
      if (error) throw error;
      if (data?.currency) {
        setCurrency(data.currency);
      }
      return data;
    },
    enabled: !!user,
  });

  // Fetch transactions for revenue calculation
  const { data: transactions, isLoading: isLoadingTransactions, error: transactionsError } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "purchase")
        .eq("status", "success");
        
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });

  // Fetch orders for order metrics and supplier data
  const { data: orders, isLoading: isLoadingOrders, error: ordersError } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          supplier_id,
          amount,
          currency,
          status,
          order_date,
          suppliers (
            id,
            name
          )
        `)
        .eq("user_id", user.id);
        
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Calculate key metrics
  const metrics = useMemo(() => {
    if (!transactions) return null;
    
    // Total revenue (all successful purchase transactions)
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Current month and previous month for growth calculation
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    const previousMonthEnd = endOfMonth(subMonths(now, 1));
    
    const currentMonthTransactions = transactions.filter(t => 
      new Date(t.created_at) >= currentMonthStart && new Date(t.created_at) <= now
    );
    
    const previousMonthTransactions = transactions.filter(t => 
      new Date(t.created_at) >= previousMonthStart && new Date(t.created_at) <= previousMonthEnd
    );
    
    const currentMonthRevenue = currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
    const previousMonthRevenue = previousMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate monthly growth percentage
    let monthlyGrowth = 0;
    if (previousMonthRevenue > 0) {
      monthlyGrowth = Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100);
    }
    
    // Total orders
    const totalOrders = orders?.length || 0;
    
    // Average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      monthlyGrowth,
      monthlyGrowthPositive: monthlyGrowth >= 0
    };
  }, [transactions, orders]);
  
  // Process data for revenue chart (monthly revenue for past 12 months)
  const revenueChartData = useMemo(() => {
    if (!transactions) return [];
    
    const monthlyRevenue: Record<string, number> = {};
    const now = new Date();
    
    // Initialize past 12 months with 0 values
    for (let i = 11; i >= 0; i--) {
      const month = subMonths(now, i);
      const monthKey = format(month, "MMM yyyy");
      monthlyRevenue[monthKey] = 0;
    }
    
    // Add transaction amounts to corresponding months
    transactions.forEach(t => {
      const transactionDate = new Date(t.created_at);
      // Only include transactions from last 12 months
      if (transactionDate > subMonths(now, 12)) {
        const monthKey = format(transactionDate, "MMM yyyy");
        if (monthlyRevenue[monthKey] !== undefined) {
          monthlyRevenue[monthKey] += t.amount;
        }
      }
    });
    
    // Format data for chart
    return Object.entries(monthlyRevenue).map(([date, value]) => ({
      date,
      value,
    }));
  }, [transactions]);
  
  // Process data for order volume chart (monthly orders for past 12 months)
  const orderVolumeChartData = useMemo(() => {
    if (!orders) return [];
    
    const monthlyOrders: Record<string, number> = {};
    const now = new Date();
    
    // Initialize past 12 months with 0 values
    for (let i = 11; i >= 0; i--) {
      const month = subMonths(now, i);
      const monthKey = format(month, "MMM yyyy");
      monthlyOrders[monthKey] = 0;
    }
    
    // Count orders for each month
    orders.forEach(order => {
      if (order.order_date) {
        const orderDate = new Date(order.order_date);
        // Only include orders from last 12 months
        if (orderDate > subMonths(now, 12)) {
          const monthKey = format(orderDate, "MMM yyyy");
          if (monthlyOrders[monthKey] !== undefined) {
            monthlyOrders[monthKey] += 1;
          }
        }
      }
    });
    
    // Format data for chart
    return Object.entries(monthlyOrders).map(([date, value]) => ({
      date,
      value,
    }));
  }, [orders]);
  
  // Process data for top suppliers table
  const topSuppliers = useMemo(() => {
    if (!orders) return [];
    
    // Group orders by supplier
    const supplierData: Record<string, {
      id: string,
      name: string,
      order_count: number,
      total_spend: number,
      currency: string
    }> = {};
    
    orders.forEach(order => {
      if (order.supplier_id && order.suppliers) {
        const supplierId = order.supplier_id;
        const supplierName = order.suppliers.name;
        
        if (!supplierData[supplierId]) {
          supplierData[supplierId] = {
            id: supplierId,
            name: supplierName,
            order_count: 0,
            total_spend: 0,
            currency: order.currency || currency
          };
        }
        
        supplierData[supplierId].order_count += 1;
        supplierData[supplierId].total_spend += order.amount || 0;
      }
    });
    
    // Sort by total spend and take top 5
    return Object.values(supplierData)
      .sort((a, b) => b.total_spend - a.total_spend)
      .slice(0, 5);
  }, [orders, currency]);
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  };
  
  // Loading and error states
  const isLoading = isLoadingTransactions || isLoadingOrders;
  const error = transactionsError || ordersError;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t("analytics")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("analytics_description")}
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center my-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 p-4 rounded-lg flex items-start gap-3 my-4">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <h3 className="font-medium text-destructive">{t("error_loading_analytics")}</h3>
              <p className="text-sm text-destructive/90">
                {error instanceof Error ? error.message : t("unknown_error")}
              </p>
            </div>
          </div>
        )}

        {/* Main content */}
        {!isLoading && !error && metrics && (
          <div className="space-y-8">
            {/* Key Metrics Cards */}
            <section>
              <h2 className="text-xl font-semibold mb-4">{t("key_metrics")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard
                  title={t("total_revenue")}
                  value={formatCurrency(metrics.totalRevenue)}
                  icon={DollarSign}
                />
                <MetricCard
                  title={t("total_orders")}
                  value={metrics.totalOrders}
                  icon={ShoppingCart}
                />
                <MetricCard
                  title={t("average_order_value")}
                  value={formatCurrency(metrics.averageOrderValue)}
                  icon={CreditCard}
                />
                <MetricCard
                  title={t("monthly_growth")}
                  value={`${metrics.monthlyGrowth}%`}
                  icon={TrendingUp}
                  trend={{
                    value: Math.abs(metrics.monthlyGrowth),
                    label: t("vs_last_month"),
                    positive: metrics.monthlyGrowthPositive,
                  }}
                />
              </div>
            </section>
            
            {/* Revenue Chart */}
            <section className="pt-4">
              <h2 className="text-xl font-semibold mb-4">{t("revenue_over_time")}</h2>
              <div className="border rounded-lg p-4 bg-card">
                <RevenueChart data={revenueChartData} currency={currency} />
              </div>
            </section>
            
            {/* Order Volume Chart */}
            <section className="pt-4">
              <h2 className="text-xl font-semibold mb-4">{t("order_volume")}</h2>
              <div className="border rounded-lg p-4 bg-card">
                <OrderVolumeChart data={orderVolumeChartData} />
              </div>
            </section>
            
            {/* Top Suppliers */}
            <section className="pt-4">
              <h2 className="text-xl font-semibold mb-4">{t("top_suppliers")}</h2>
              <SupplierTable suppliers={topSuppliers} currency={currency} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default AnalyticsPage;
