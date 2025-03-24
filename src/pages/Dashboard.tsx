
import { useEffect } from "react";
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

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Fetch user data with error handling
  const { data: userData, isLoading, isError, error } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
          
        if (error) {
          console.error("Error fetching user profile:", error.message);
          throw error;
        }
        
        return data;
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        toast({
          title: t("profile_error"),
          description: t("profile_load_error"),
          variant: "destructive",
        });
        throw err;
      }
    },
    enabled: !!user?.id,
    retry: 2,
    staleTime: 60000, // 1 minute
  });

  // Fetch orders, transactions, and tax reports data
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("shopper_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("shopper_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: taxReports, isLoading: taxReportsLoading } = useQuery({
    queryKey: ["taxReports", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("tax_reports")
        .select("*")
        .eq("shopper_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
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

  useEffect(() => {
    document.title = `${t("dashboard")} | TaxMaster`;
  }, [t]);

  const isLoading = ordersLoading || transactionsLoading || taxReportsLoading;

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

        {/* Dashboard Statistics */}
        <DashboardStats 
          stats={dashboardStats} 
          isLoading={isLoading} 
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
