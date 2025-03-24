
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, FileText } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";

interface TaxReport {
  id: string;
  title: string;
  description: string;
  file_url?: string;
  file_type?: "pdf" | "csv";
  shopper_id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  total_tax: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

interface TaxReportCardProps {
  report: TaxReport;
}

const TaxReportCard = ({ report }: TaxReportCardProps) => {
  const { t } = useTranslation();
  
  // Function to format currency
  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  // Format dates for display
  const formattedStartDate = format(new Date(report.period_start), "MMM d, yyyy");
  const formattedEndDate = format(new Date(report.period_end), "MMM d, yyyy");
  const formattedCreatedDate = format(new Date(report.created_at), "PP");

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{report.title}</CardTitle>
            <CardDescription className="mt-1">
              {t("created")}: {formattedCreatedDate}
            </CardDescription>
          </div>
          <div className="p-2 bg-primary/10 rounded-full">
            <FileText className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{formattedStartDate} - {formattedEndDate}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <p className="text-sm text-muted-foreground">{t("total_amount")}</p>
              <p className="font-medium">{formatCurrency(report.total_amount, report.currency)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("total_tax")}</p>
              <p className="font-medium">{formatCurrency(report.total_tax, report.currency)}</p>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t bg-muted/20 pt-4 pb-4">
        {report.file_url ? (
          <a 
            href={report.file_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button 
              variant="outline" 
              className="w-full flex gap-2 items-center"
            >
              <Download className="h-4 w-4" />
              {report.file_type === "pdf" ? t("download_pdf") : t("download_report")}
            </Button>
          </a>
        ) : (
          <Button 
            variant="outline" 
            className="w-full flex gap-2 items-center opacity-50 cursor-not-allowed"
            disabled
          >
            <FileText className="h-4 w-4" />
            {t("no_export_available")}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TaxReportCard;
