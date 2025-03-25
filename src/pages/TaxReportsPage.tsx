
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import TaxReportCard from "@/components/tax-reports/TaxReportCard";
import { FileText, AlertCircle, Calendar, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import DateRangePicker from "@/components/orders/DateRangePicker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

// Interface for the tax reports as received from the database
interface TaxReportDB {
  id: string;
  user_id: string;
  period: string;
  taxable_income: number;
  expected_tax: number;
  vat_paid: number | null;
  vat_refunded: number | null;
  created_at: string;
  updated_at: string;
}

// Interface for the tax reports as used in the UI
interface TaxReport {
  id: string;
  title: string;
  description: string;
  file_url?: string;
  file_type?: "pdf" | "csv";
  user_id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  total_tax: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

const TaxReportsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  
  // Fetch tax reports
  const { data: reports, isLoading, error } = useQuery({
    queryKey: ["taxReports", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("tax_reports")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      // Transform the data to match our TaxReport interface
      const transformedData = data.map((report: TaxReportDB) => {
        // Extract date range from period (assuming format like "2023-01-01:2023-03-31")
        const [startDate, endDate] = report.period.split(":");
        
        return {
          id: report.id,
          title: `${format(new Date(startDate), 'MMM d, yyyy')} - ${format(new Date(endDate), 'MMM d, yyyy')}`,
          description: `${t("total_amount")}: ${report.taxable_income} EUR, ${t("total_tax")}: ${report.expected_tax} EUR`,
          file_url: undefined, // No file URL in the schema
          file_type: undefined, // No file type in the schema
          user_id: report.user_id,
          period_start: startDate,
          period_end: endDate,
          total_amount: report.taxable_income,
          total_tax: report.expected_tax,
          currency: "EUR", // Default currency
          created_at: report.created_at,
          updated_at: report.updated_at
        };
      }) as TaxReport[];
      
      return transformedData;
    },
    enabled: !!user,
  });

  // Generate new tax report
  const generateReportMutation = useMutation({
    mutationFn: async (dateRange: DateRange) => {
      if (!user) throw new Error("User not authenticated");
      if (!dateRange.from || !dateRange.to) throw new Error("Please select a date range");
      
      // Format dates for the database
      const periodStart = format(dateRange.from, 'yyyy-MM-dd');
      const periodEnd = format(dateRange.to, 'yyyy-MM-dd');
      const periodString = `${periodStart}:${periodEnd}`;

      // 1. Query orders/transactions in the selected date range
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("amount, currency")
        .eq("user_id", user.id)
        .gte("order_date", periodStart)
        .lte("order_date", periodEnd);
        
      if (ordersError) throw ordersError;
      
      // 2. Calculate totals
      const totalAmount = ordersData.reduce((sum, order) => sum + (order.amount || 0), 0);
      // For this example, we'll estimate tax as 19% of total amount
      const totalTax = totalAmount * 0.19;
      
      // 3. Insert new tax report
      const { data, error } = await supabase
        .from("tax_reports")
        .insert({
          user_id: user.id,
          period: periodString,
          taxable_income: totalAmount,
          expected_tax: totalTax,
          vat_paid: null,
          vat_refunded: null
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: t("report_generated"),
        description: t("tax_report_success_description"),
      });
      setIsGenerateDialogOpen(false);
      setDateRange({ from: undefined, to: undefined });
      // Invalidate the tax reports query to refetch the data
      queryClient.invalidateQueries({ queryKey: ["taxReports", user?.id] });
    },
    onError: (error) => {
      toast({
        title: t("error_generating_report"),
        description: error instanceof Error ? error.message : t("unknown_error"),
        variant: "destructive",
      });
    }
  });

  const handleGenerateReport = () => {
    if (!dateRange.from || !dateRange.to) {
      toast({
        title: t("invalid_date_range"),
        description: t("please_select_both_start_and_end_dates"),
        variant: "destructive",
      });
      return;
    }

    generateReportMutation.mutate(dateRange);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t("tax_reports")}</h1>
            <p className="text-muted-foreground mt-2">
              {t("tax_reports_description")}
            </p>
          </div>
          
          <Button 
            onClick={() => setIsGenerateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("generate_report")}
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center my-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 p-4 rounded-lg flex items-start gap-3 my-4">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <h3 className="font-medium text-destructive">{t("error_loading_reports")}</h3>
              <p className="text-sm text-destructive/90">
                {error instanceof Error ? error.message : t("unknown_error")}
              </p>
            </div>
          </div>
        )}

        {reports && reports.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">{t("no_reports_available")}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t("no_reports_description")}
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports?.map((report) => (
            <TaxReportCard key={report.id} report={report} />
          ))}
        </div>
      </main>

      {/* Generate Tax Report Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("generate_tax_report")}</DialogTitle>
            <DialogDescription>
              {t("select_date_range_for_report")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("report_period")}</label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsGenerateDialogOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleGenerateReport}
                disabled={!dateRange.from || !dateRange.to || generateReportMutation.isPending}
                className="gap-2"
              >
                {generateReportMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    {t("generating")}
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    {t("generate_report")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaxReportsPage;
