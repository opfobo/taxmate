
import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";
import { 
  Loader2, 
  ShoppingBag, 
  CreditCard, 
  Package, 
  FileText, 
  AlertCircle,
  ReceiptText,
  ArrowUpRight
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import StatCard from "@/components/dashboard/StatCard";
import ActivityItem from "@/components/dashboard/ActivityItem";
import EmptyState from "@/components/dashboard/EmptyState";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Define query options with proper error handling
  const queryOptions = {
    retry: 2,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    enabled: !!user?.id,
  };

  // Fetch user data with error handling
  const { 
    data: userData, 
    isLoading: userLoading, 
    isError: userIsError, 
    error: userError 
  } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) {
        console.error("Error fetching user profile:", error.message);
        toast({
          title: t("profile_error"),
          description: t("profile_load_error"),
          variant: "destructive",
        });
        throw error;
      }
      
      return data;
    },
    ...queryOptions,
  });

  // Fetch orders data
  const { 
    data: orders, 
    isLoading: ordersLoading,
    isError: ordersIsError,
    error: ordersError
  } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) {
        console.error("Error fetching orders:", error.message);
        toast({
          title: t("order_fetch_error"),
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    },
    ...queryOptions,
  });

  // Fetch transactions data
  const { 
    data: transactions, 
    isLoading: transactionsLoading,
    isError: transactionsIsError,
    error: transactionsError
  } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) {
        console.error("Error fetching transactions:", error.message);
        toast({
          title: t("transaction_fetch_error"),
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    },
    ...queryOptions,
  });

  // Fetch tax reports data
  const { 
    data: taxReports, 
    isLoading: taxReportsLoading,
    isError: taxReportsIsError,
    error: taxReportsError
  } = useQuery({
    queryKey: ["taxReports", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("tax_reports")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5);
      
      if (error) {
        console.error("Error fetching tax reports:", error.message);
        toast({
          title: t("tax_report_fetch_error"),
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    },
    ...queryOptions,
  });

  // Format currency amounts
  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  // Calculate dashboard statistics
  const totalOrders = orders?.length || 0;
  
  const totalSpent = transactions
    ?.filter(tx => tx?.type === 'purchase' && tx?.status === 'success')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
  
  const openOrders = orders
    ?.filter(order => order.status !== 'delivered')
    .length || 0;
  
  const lastTaxReport = taxReports && taxReports.length > 0 
    ? taxReports[0].period 
    : null;

  const currency = userData?.currency || "EUR";

  // Refresh all dashboard data
  const refreshDashboardData = useCallback(() => {
    if (user?.id) {
      // Use queryClient to invalidate and refetch all data
      // This will be added in Part 2 if needed
    }
  }, [user?.id]);

  // Update document title
  useEffect(() => {
    document.title = `${t("dashboard")} | TaxMaster`;
  }, [t]);

  // Combined loading state for all data fetching
  const isDataLoading = userLoading || ordersLoading || transactionsLoading || taxReportsLoading;
  
  // Combined error state
  const hasError = userIsError || ordersIsError || transactionsIsError || taxReportsIsError;

  // Display a generic error message if any query fails
  useEffect(() => {
    if (hasError) {
      const errorMessage = userError || ordersError || transactionsError || taxReportsError;
      console.error("Dashboard data fetch error:", errorMessage);
    }
  }, [hasError, userError, ordersError, transactionsError, taxReportsError]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
          <p className="text-muted-foreground">
            {t("user_dashboard_description")}
          </p>
        </div>

        {/* Global loading indicator */}
        {isDataLoading && (
          <div className="flex justify-center my-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error state */}
        {hasError && !isDataLoading && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 py-6">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <h3 className="font-medium">{t("data_loading_error")}</h3>
                <p className="text-sm text-muted-foreground">{t("try_refreshing")}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Statistics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard 
            title={t("total_orders")}
            value={totalOrders}
            icon={ShoppingBag}
            loading={ordersLoading}
          />
          <StatCard 
            title={t("total_spent")}
            value={formatCurrency(totalSpent, currency)}
            icon={CreditCard}
            loading={transactionsLoading}
          />
          <StatCard 
            title={t("open_orders")}
            value={openOrders}
            icon={Package}
            loading={ordersLoading}
          />
          <StatCard 
            title={t("last_tax_report")}
            value={lastTaxReport || t("no_reports")}
            icon={FileText}
            loading={taxReportsLoading}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Activities Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">{t("recent_orders")}</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-4 w-2/3 animate-pulse bg-muted rounded-md mb-2" />
                        <div className="h-3 w-1/2 animate-pulse bg-muted rounded-md" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="h-4 w-16 animate-pulse bg-muted rounded-md mb-1" />
                        <div className="h-3 w-12 animate-pulse bg-muted rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : orders?.length === 0 ? (
                <EmptyState 
                  icon={ShoppingBag} 
                  title={t("no_orders_yet")}
                  description={t("orders_will_appear_here")}
                />
              ) : (
                <div className="space-y-1">
                  {orders?.map((order) => (
                    <div key={order.id}>
                      <ActivityItem 
                        title={order.order_number || `#${order.id.substring(0, 8)}`}
                        subtitle={t("order_from")}
                        timestamp={order.created_at}
                        status={order.status}
                      />
                      <Separator className="my-1" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">{t("recent_transactions")}</CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-4 w-2/3 animate-pulse bg-muted rounded-md mb-2" />
                        <div className="h-3 w-1/2 animate-pulse bg-muted rounded-md" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="h-4 w-16 animate-pulse bg-muted rounded-md mb-1" />
                        <div className="h-3 w-12 animate-pulse bg-muted rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : transactions?.length === 0 ? (
                <EmptyState 
                  icon={ReceiptText} 
                  title={t("no_transactions_yet")}
                  description={t("transactions_will_appear_here")}
                />
              ) : (
                <div className="space-y-1">
                  {transactions?.map((transaction) => (
                    <div key={transaction.id}>
                      <ActivityItem 
                        title={t(transaction?.type ?? "transaction")}
                        subtitle={transaction.payment_method || t("payment")}
                        timestamp={transaction.created_at}
                        status={transaction.status}
                        amount={formatCurrency(transaction.amount, transaction.currency)}
                      />
                      <Separator className="my-1" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Tax Reports */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">{t("tax_reports")}</CardTitle>
            </CardHeader>
            <CardContent>
              {taxReportsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-4 w-2/3 animate-pulse bg-muted rounded-md mb-2" />
                        <div className="h-3 w-1/2 animate-pulse bg-muted rounded-md" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="h-4 w-16 animate-pulse bg-muted rounded-md mb-1" />
                        <div className="h-3 w-12 animate-pulse bg-muted rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : taxReports?.length === 0 ? (
                <EmptyState 
                  icon={ArrowUpRight} 
                  title={t("no_tax_reports_yet")}
                  description={t("tax_reports_will_appear_here")}
                />
              ) : (
                <div className="space-y-1">
                  {taxReports?.map((report) => (
                    <div key={report.id}>
                      <ActivityItem 
                        title={report.period}
                        subtitle={formatCurrency(report.taxable_income || 0, currency)}
                        timestamp={report.updated_at}
                        amount={formatCurrency(report.vat_refunded || 0, currency)}
                      />
                      <Separator className="my-1" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
