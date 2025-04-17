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
import { mapOcrInvoiceMapping } from "@/lib/ocr/OcrInvoiceMappings";
import {
  EditableText,
  EditableCurrency,
  TaxRateSelector,
} from "@/components/ocr/OcrReviewEditable";

const OcrReviewPage = () => {
  const { ocrRequestId } = useParams<{ ocrRequestId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const { data: ocrRequest, isLoading: isLoadingRequest } = useQuery({
    queryKey: ["ocrRequest", ocrRequestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ocr_requests")
        .select("*")
        .eq("id", ocrRequestId)
        .single();
      if (error) throw error;
      return data;
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
      return data;
    },
    enabled: !!ocrRequestId && !!user,
    onSuccess: (data) => {
      setFormData(data);
    },
  });

  const { data: lineItems = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ["invoiceLineItems", invoiceMapping?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ocr_invoice_items")
        .select("*")
        .eq("mapping_id", invoiceMapping?.id)
        .order("item_index", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!invoiceMapping?.id,
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!invoiceMapping?.id) return;
    await supabase.from("ocr_invoice_mappings").update(formData).eq("id", invoiceMapping.id);
    toast({ title: "Changes saved", description: "Your changes have been saved." });
    setIsEditing(false);
  };

  const isLoading = isLoadingRequest || isLoadingMapping;

  return (
    <PageLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t("ocr.document_review")}</h1>
          <div className="space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="mr-2 h-4 w-4" /> {t("cancel")}
                </Button>
                <Button onClick={handleSubmit}>
                  <Save className="mr-2 h-4 w-4" /> {t("save")}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" /> {t("edit")}
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
                <OcrDocumentPreview filePath={invoiceMapping?.file_path ?? ""} fileName={ocrRequest?.file_name ?? ""} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("ocr.document_details")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h3 className="font-semibold mb-2">{t("ocr.invoice_details")}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">{t("ocr.invoice_number")}</div>
                  <EditableText value={formData.invoice_number} onChange={(val) => handleChange("invoice_number", val)} isEditing={isEditing} />

                  <div className="text-muted-foreground">{t("ocr.invoice_date")}</div>
                  <EditableText value={formData.invoice_date} onChange={(val) => handleChange("invoice_date", val)} isEditing={isEditing} />

                  <div className="text-muted-foreground">{t("ocr.total_amount")}</div>
                  <EditableCurrency value={formData.total_amount} onChange={(val) => handleChange("total_amount", val)} isEditing={isEditing} />

                  <div className="text-muted-foreground">{t("ocr.tax_rate")}</div>
                  <TaxRateSelector value={formData.total_tax} onChange={(val) => handleChange("total_tax", val)} isEditing={isEditing} />

                  <div className="text-muted-foreground">{t("ocr.supplier_name")}</div>
                  <EditableText value={formData.supplier_name} onChange={(val) => handleChange("supplier_name", val)} isEditing={isEditing} />

                  <div className="text-muted-foreground">{t("ocr.supplier_address")}</div>
                  <EditableText value={formData.supplier_address} onChange={(val) => handleChange("supplier_address", val)} isEditing={isEditing} />

                  <div className="text-muted-foreground">{t("ocr.supplier_vat")}</div>
                  <EditableText value={formData.supplier_vat} onChange={(val) => handleChange("supplier_vat", val)} isEditing={isEditing} />
                </div>

                <Separator className="my-4" />

                <h3 className="font-semibold mb-2">{t("ocr.invoice_items")}</h3>
                <div className="grid grid-cols-6 gap-2 text-sm font-medium mb-1">
                  <div>{t("ocr.item_index")}</div>
                  <div className="col-span-2">{t("ocr.description")}</div>
                  <div>{t("ocr.quantity")}</div>
                  <div>{t("ocr.unit_price")}</div>
                  <div>{t("ocr.total_price")}</div>
                </div>

                {lineItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-6 gap-2 text-sm border-b py-1">
                    <div>{item.item_index ?? index + 1}</div>
                    <EditableText value={item.description} isEditing={isEditing} onChange={(val) => {}} className="col-span-2" />
                    <EditableCurrency value={item.quantity} isEditing={isEditing} onChange={(val) => {}} />
                    <EditableCurrency value={item.unit_price} isEditing={isEditing} onChange={(val) => {}} />
                    <EditableCurrency value={item.total_price} isEditing={isEditing} onChange={(val) => {}} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default OcrReviewPage;
