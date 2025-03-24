
import { useTranslation } from "@/hooks/useTranslation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface TaxReport {
  id: string;
  period: string;
  vat_refunded: number | null;
  updated_at: string;
  taxable_income: number;
  expected_tax: number;
}

interface RecentTaxReportsTableProps {
  taxReports: TaxReport[];
  isLoading: boolean;
}

const RecentTaxReportsTable = ({ taxReports, isLoading }: RecentTaxReportsTableProps) => {
  const { t } = useTranslation();

  const formatCurrency = (amount: number | null, currency: string = "EUR") => {
    if (amount === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const getReportStatus = (report: TaxReport) => {
    if (report.vat_refunded) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t("refunded")}</Badge>;
    } else if (report.expected_tax) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{t("pending")}</Badge>;
    } else {
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">{t("processing")}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (taxReports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t("no_tax_reports_found")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("reporting_period")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("vat_refunded")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {taxReports.map((report) => (
            <TableRow key={report.id}>
              <TableCell className="font-medium">{report.period}</TableCell>
              <TableCell>{getReportStatus(report)}</TableCell>
              <TableCell>
                {formatCurrency(report.vat_refunded)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RecentTaxReportsTable;
