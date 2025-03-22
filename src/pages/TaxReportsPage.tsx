
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import TaxReportCard from "@/components/tax-reports/TaxReportCard";
import { FileText, AlertCircle } from "lucide-react";

// Interface for the tax reports as received from the database
interface TaxReportDB {
  id: string;
  period: string;
  taxable_income: number;
  expected_tax: number;
  shopper_id: string;
  created_at: string;
  updated_at: string;
  vat_paid: number | null;
  vat_refunded: number | null;
  title?: string;
  description?: string;
  file_url?: string;
  file_type?: "pdf" | "csv";
}

// Interface for the tax reports as used in the UI
interface TaxReport {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: "pdf" | "csv";
  shopper_id: string;
  
  created_at?: string;
  updated_at?: string;
  period?: string;
  taxable_income?: number;
  expected_tax?: number;
  vat_paid?: number;
  vat_refunded?: number;
}

const TaxReportsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const { data: reports, isLoading, error } = useQuery({
    queryKey: ["taxReports", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("tax_reports")
        .select("*")
        .eq("shopper_id", user.id);
      
      if (error) throw error;
      
      // Transform the data to match our TaxReport interface
      const transformedData = data.map((report: TaxReportDB) => ({
        id: report.id,
        title: report.title || `${report.period} Tax Report`,
        description: report.description || `Taxable income: ${report.taxable_income}, Expected tax: ${report.expected_tax}`,
        file_url: report.file_url || '#',
        file_type: report.file_type || 'pdf' as "pdf" | "csv",
        shopper_id: report.shopper_id,
        created_at: report.created_at,
        updated_at: report.updated_at,
        period: report.period,
        taxable_income: report.taxable_income,
        expected_tax: report.expected_tax,
        vat_paid: report.vat_paid,
        vat_refunded: report.vat_refunded
      })) as TaxReport[];
      
      return transformedData;
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t("tax_reports")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("tax_reports_description")}
          </p>
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
    </div>
  );
};

export default TaxReportsPage;
