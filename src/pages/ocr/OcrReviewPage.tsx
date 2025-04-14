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
import { mapOcrInvoiceMapping, mapOcrInvoiceLineItems } from "@/lib/ocr/OcrInvoiceMappings";


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

  const { data: lineItems, isLoading: isLoadingItems } = useQuery({
  queryKey: ["invoiceLineItems", invoiceMapping?.id],
  queryFn: async () => {
    if (!invoiceMapping?.id) return [];
    const { data, error } = await supabase
      .from("ocr_invoice_items")
      .select("*")
      .eq("mapping_id", invoiceMapping.id)
      .order("item_index", { ascending: true });
    if (error) throw error;
    return data;
  },
  enabled: !!invoiceMapping?.id,
});

  const isLoading = isLoadingRequest || isLoadingMapping;

  const mappedFallback = ocrRequest?.response
  ? mapOcrInvoiceMapping(ocrRequest.response)
  : null;

  const documentMeta = {
    fileName: ocrRequest?.file_name || "Document",
    uploadDate: ocrRequest?.created_at ? format(new Date(ocrRequest.created_at), "PPP") : "-",
    rawData: ocrRequest?.response || {},
    imageUrl: undefined, // <-- wichtig: NICHT direkt generieren
    filePath: invoiceMapping?.file_path || "", // <-- das hier nutzen
    status: invoiceMapping?.status || "pending",
    invoiceNumber: invoiceMapping?.invoice_number || "-",
    invoiceDate: invoiceMapping?.invoice_date
      ? format(new Date(invoiceMapping.invoice_date), "PPP")
      : "-",
    totalAmount: invoiceMapping?.total_amount
      ? `${invoiceMapping.total_amount} ${invoiceMapping.currency || "EUR"}`
      : "-",
  };

  const handleSubmit = async () => {
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
  <Card>
    <CardHeader>
      <CardTitle>{t("ocr.document_preview")}</CardTitle>
    </CardHeader>
    <CardContent>
      <OcrDocumentPreview
        filePath={documentMeta.filePath}
        fileName={documentMeta.fileName}
      />
    </CardContent>
  </Card>

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
            {documentMeta.status === "confirmed" ? t("ocr.confirmed")
 : documentMeta.status === "error" ? t("ocr.error")
 : t("ocr.pending")}
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-2">{t("ocr.invoice_details")}</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-muted-foreground">{t("ocr.invoice_number")}</div>
          <div>{invoiceMapping?.invoice_number ?? mappedFallback?.invoice_number ?? "-"}</div>

          <div className="text-muted-foreground">{t("ocr.invoice_date")}</div>
<div>
  {invoiceMapping?.invoice_date
    ? format(new Date(invoiceMapping.invoice_date), "PPP")
    : (mappedFallback?.invoice_date &&
        !isNaN(Date.parse(mappedFallback.invoice_date)))
      ? format(new Date(mappedFallback.invoice_date), "PPP")
      : "-"}
</div>


          <div className="text-muted-foreground">{t("ocr.total_amount")}</div>
          <div className="font-medium">
            {typeof (invoiceMapping?.total_amount ?? mappedFallback?.total_amount) === "number"
  ? (invoiceMapping?.total_amount ?? mappedFallback?.total_amount).toFixed(2)
  : "-"}{" "}
{invoiceMapping?.currency || mappedFallback?.currency || "EUR"}

          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-2">{t("ocr.supplier_info")}</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-muted-foreground">{t("ocr.supplier_name")}</div>
          <div>{invoiceMapping?.supplier_name ?? mappedFallback?.supplier_name ?? "-"}</div>

          <div className="text-muted-foreground">{t("ocr.supplier_address")}</div>
          <div>{invoiceMapping?.supplier_address ?? mappedFallback?.supplier_address_raw ?? "-"}</div>

          <div className="text-muted-foreground">{t("ocr.supplier_vat")}</div>
          <div>{invoiceMapping?.supplier_vat ?? mappedFallback?.supplier_vat ?? "-"}</div>
        </div>
      </div>
      <Separator />

<div>
  <h3 className="font-semibold mb-2">{t("ocr.invoice_items")}</h3>
  {isLoadingItems ? (
    <Loader2 className="h-5 w-5 animate-spin text-primary" />
  ) : (!lineItems?.length ? (
    <p className="text-sm text-muted-foreground">{t("ocr.no_items_found")}</p>
  ) : (
    <div className="grid grid-cols-6 gap-2 text-sm font-medium mb-1">
      <div>{t("ocr.item_index")}</div>
      <div className="col-span-2">{t("ocr.description")}</div>
      <div>{t("ocr.quantity")}</div>
      <div>{t("ocr.unit_price")}</div>
      <div>{t("ocr.total_price")}</div>
    </div>
  ))}

  {lineItems?.map((item, index) => (
    <div
      key={item.id}
      className="grid grid-cols-6 gap-2 text-sm border-b py-1"
    >
      <div>{item.item_index ?? index + 1}</div>
      <div className="col-span-2">{item.description ?? "-"}</div>
      <div>{item.quantity ?? "-"}</div>
      <div>
        {typeof item.unit_price === "number"
  ? item.unit_price.toFixed(2)
  : "-"}

      </div>
      <div>
        {item.total_price !== null
          ? item.total_price.toFixed(2)
          : "-"}
      </div>
    </div>
  ))}
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
