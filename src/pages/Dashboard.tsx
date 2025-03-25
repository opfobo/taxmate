
import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentOrdersTable from "@/components/dashboard/RecentOrdersTable";
import RecentTransactionsTable from "@/components/dashboard/RecentTransactionsTable";
import RecentTaxReportsTable from "@/components/dashboard/RecentTaxReportsTable";
import { Loader2 } from "lucide-react";

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
        .eq("shopper_id", user.id)
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
        .eq("shopper_id", user.id)
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
        .eq("shopper_id", user.id)
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

  // Calculate dashboard statistics
  const dashboardStats = {
    totalOrders: orders?.length || 0,
    totalSpent: transactions
      ?.filter(tx => tx.type === 'purchase' && tx.status === 'success')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0,
    totalRefundedVat: taxReports
      ?.reduce((sum, report) => sum + (report.vat_refunded || 0), 0) || 0,
    currency: userData?.currency || "EUR",
  };

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
            {t("shopper_dashboard_description")}
          </p>
        </div>

        {/* Global loading indicator */}
        {isDataLoading && (
          <div className="flex justify-center my-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Dashboard Statistics */}
        <DashboardStats 
          stats={dashboardStats} 
          isLoading={isDataLoading} 
        />

        <div className="grid grid-cols-1 gap-6 mt-8">
          {/* Recent Orders */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">{t("recent_orders")}</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentOrdersTable 
                orders={orders || []} 
                isLoading={ordersLoading} 
              />
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">{t("recent_transactions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTransactionsTable 
                transactions={transactions || []} 
                isLoading={transactionsLoading} 
              />
            </CardContent>
          </Card>

          {/* Recent Tax Reports */}
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">{t("tax_reports")}</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTaxReportsTable 
                taxReports={taxReports || []} 
                isLoading={taxReportsLoading} 
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
