
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

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

  useEffect(() => {
    document.title = `${t("dashboard")} | TaxMaster`;
  }, [t]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
          <p className="text-muted-foreground">
            {t("welcome_dashboard")}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : isError ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center text-destructive">
                <p>{t("profile_data_error")}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("refresh_page")}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t("account_information")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("name")}:</span>
                    <span>{userData?.name || t("not_provided")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("email")}:</span>
                    <span>{userData?.email || t("not_provided")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("role")}:</span>
                    <span className="capitalize">{userData?.role || t("not_assigned")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t("tax_overview")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t("tax_info_will_appear")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t("recent_transactions")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t("transactions_will_appear")}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
