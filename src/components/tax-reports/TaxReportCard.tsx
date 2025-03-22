import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileText } from "lucide-react";

interface TaxReportCardProps {
  report: {
    id: string;
    title: string;
    description: string;
    file_url: string;
    file_type: "pdf" | "csv";
  };
}

export const TaxReportCard = ({ report }: TaxReportCardProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      // If file_url is already a full URL, use it directly
      if (report.file_url.startsWith("http")) {
        window.open(report.file_url, "_blank");
        setIsDownloading(false);
        return;
      }

      // Otherwise, try to get a download URL from Supabase storage
      const { data, error } = await supabase.storage
        .from("tax-reports")
        .createSignedUrl(report.file_url, 60);
      
      if (error) throw error;
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: t("download_error"),
        description: t("could_not_download_report"),
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{report.title}</CardTitle>
        <CardDescription>{report.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
              {report.file_type.toUpperCase()}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleDownload}
          className="w-full"
          variant="outline"
          disabled={isDownloading}
        >
          <FileDown className="h-4 w-4 mr-2" />
          {isDownloading 
            ? t("downloading") 
            : report.file_type === "pdf" 
              ? t("download_pdf") 
              : t("download_csv")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TaxReportCard;
