
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { PageLayout } from "@/components/common/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Check, X, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import OcrDocumentPreview from "@/components/ocr/OcrDocumentPreview";
import { format } from "date-fns";

// Define types for the OCR data
interface OcrRequestData {
  id: string;
  created_at: string;
  file_name: string;
  status: string;
  user_id: string;
  response: any;
  processed_at: string;
}

interface OcrInvoiceMapping {
  id: string;
  ocr_request_id: string;
  user_id: string;
  created_at: string;
  supplier_name?: string;
  supplier_address?: string;
  supplier_vat?: string;
  invoice_number?: string;
  invoice_date?: string;
  total_amount?: number;
  total_net?: number;
  total_tax?: number;
  currency?: string;
  customer_name?: string;
  customer_address?: string;
  status?: string;
  confirmed_at?: string;
  file_path?: string;
  line_items?: any;
}

const OcrReviewPage = () => {
  const { ocrRequestId } = useParams<{ ocrRequestId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch OCR request data
  const { data: ocrRequest, isLoading: isLoadingRequest } = useQuery({
    queryKey: ["ocrRequest", ocrRequestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ocr_requests")
        .select("*")
        .eq("id", ocrRequestId)
        .single();

      if (error) throw error;
      return data as OcrRequestData;
    },
    enabled: !!ocrRequestId && !!user,
  });

  // Fetch OCR invoice mapping data
  const { data: invoiceMapping, isLoading: isLoadingMapping } = useQuery({
    queryKey: ["invoiceMapping", ocrRequestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ocr_invoice_mappings")
        .select("*")
        .eq("ocr_request_id", ocrRequestId)
        .single();

      if (error) throw error;
      return data as OcrInvoiceMapping;
    },
    enabled: !!ocrRequestId && !!user,
  });

  // Combined loading state
  const isLoading = isLoadingRequest || isLoadingMapping;

  // Prepare document metadata for display
  const documentMeta = {
    fileName: ocrRequest?.file_name || "Document",
    uploadDate: ocrRequest?.created_at ? format(new Date(ocrRequest.created_at), "PPP") : "-",
    rawData: ocrRequest?.response || {},
    imageUrl: invoiceMapping?.file_path || "",
    status: invoiceMapping?.status || "pending",
    invoiceNumber: invoiceMapping?.invoice_number || "-",
    invoiceDate: invoiceMapping?.invoice_date 
      ? format(new Date(invoiceMapping.invoice_date), "PPP") 
      : "-",
    dueDate: "-", // Not available in current schema
    totalAmount: invoiceMapping?.total_amount 
      ? `${invoiceMapping.total_amount} ${invoiceMapping.currency || "EUR"}` 
      : "-",
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Logic for saving edited data would go here
    setIsEditing(false);
    toast({
      title: "Changes saved",
      description: "Your changes have been saved successfully.",
    });
  };

  return (
    <PageLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t("ocr.document_review")}</h1>
          <div className="space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="mr-2 h-4 w-4" />
                  {t("cancel")}
                </Button>
                <Button onClick={handleSubmit}>
                  <Save className="mr-2 h-4 w-4" />
                  {t("save")}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                {t("edit")}
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Document Preview */}
            <Card>
              <CardHeader>
                <CardTitle>{t("ocr.document_preview")}</CardTitle>
              </CardHeader>
              <CardContent>
                <OcrDocumentPreview 
                  imageUrl={documentMeta.imageUrl} 
                  fileName={documentMeta.fileName}
                />
              </CardContent>
            </Card>

            {/* Document Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t("ocr.document_details")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{t("ocr.document_info")}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">{t("ocr.file_name")}</div>
                    <div>{documentMeta.fileName}</div>
                    
                    <div className="text-muted-foreground">{t("ocr.upload_date")}</div>
                    <div>{documentMeta.uploadDate}</div>
                    
                    <div className="text-muted-foreground">{t("ocr.status")}</div>
                    <div className="flex items-center">
                      {documentMeta.status === "confirmed" ? (
                        <Check className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-amber-500 mr-2" />
                      )}
                      {documentMeta.status === "confirmed" ? t("ocr.confirmed") : t("ocr.pending")}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-2">{t("ocr.invoice_details")}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">{t("ocr.invoice_number")}</div>
                    <div>{documentMeta.invoiceNumber}</div>
                    
                    <div className="text-muted-foreground">{t("ocr.invoice_date")}</div>
                    <div>{documentMeta.invoiceDate}</div>
                    
                    <div className="text-muted-foreground">{t("ocr.total_amount")}</div>
                    <div className="font-medium">{documentMeta.totalAmount}</div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-2">{t("ocr.supplier_info")}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">{t("ocr.supplier_name")}</div>
                    <div>{invoiceMapping?.supplier_name || "-"}</div>
                    
                    <div className="text-muted-foreground">{t("ocr.supplier_address")}</div>
                    <div>{invoiceMapping?.supplier_address || "-"}</div>
                    
                    <div className="text-muted-foreground">{t("ocr.supplier_vat")}</div>
                    <div>{invoiceMapping?.supplier_vat || "-"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default OcrReviewPage;
