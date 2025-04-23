
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/common/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { mapOcrInvoiceMapping, mapOcrInvoiceLineItems } from "@/lib/ocr/OcrInvoiceMappings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import OcrInvoiceReview from "@/components/ocr/OcrInvoiceReview";

const OcrReviewPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { ocrRequestId } = useParams<{ ocrRequestId: string }>();
  const [mappedInvoice, setMappedInvoice] = useState<any | null>(null);
  const [mappedItems, setMappedItems] = useState<any[] | null>(null);

  // Fetch the OCR request data
  const { data: ocrRequest, isLoading: isLoadingOcrRequest } = useQuery({
    queryKey: ["ocr_request", ocrRequestId],
    queryFn: async () => {
      if (!ocrRequestId) throw new Error("No OCR request ID provided");
      
      const { data, error } = await supabase
        .from("ocr_requests")
        .select("*")
        .eq("id", ocrRequestId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!ocrRequestId && !!user
  });

  // Once we have the OCR request, check if there's already a mapping created for it
  const { data: existingMapping } = useQuery({
    queryKey: ["ocr_mapping", ocrRequestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ocr_invoice_mappings")
        .select("*")
        .eq("ocr_request_id", ocrRequestId)
        .single();
      
      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned, which is fine
          return null;
        }
        throw error;
      }
      
      return data;
    },
    enabled: !!ocrRequestId && !!ocrRequest
  });

  // Fetch the line items if we have a mapping
  const { data: lineItems } = useQuery({
    queryKey: ["ocr_line_items", existingMapping?.id],
    queryFn: async () => {
      if (!existingMapping?.id) return [];
      
      const { data, error } = await supabase
        .from("ocr_invoice_items")
        .select("*")
        .eq("mapping_id", existingMapping.id)
        .order("item_index", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!existingMapping?.id
  });

  // Map the OCR data if we have it
  useEffect(() => {
    if (ocrRequest?.response) {
      try {
        const mapped = mapOcrInvoiceMapping(ocrRequest.response);
        const items = mapOcrInvoiceLineItems(ocrRequest.response);
        
        setMappedInvoice(mapped);
        setMappedItems(items);
      } catch (error) {
        console.error("Error mapping OCR data:", error);
        toast({
          title: t("error"),
          description: t("error_processing_ocr_data"),
          variant: "destructive",
        });
      }
    }
  }, [ocrRequest, toast, t]);

  return (
    <PageLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">{t("ocr.review.title")}</h1>
        
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="preview">
              <TabsList className="mb-6">
                <TabsTrigger value="preview">{t("ocr.review.preview")}</TabsTrigger>
                <TabsTrigger value="raw">{t("ocr.review.raw_data")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview">
                <OcrInvoiceReview />
              </TabsContent>
              
              <TabsContent value="raw">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">{t("ocr.review.raw_response")}</h2>
                  <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-[500px]">
                    {ocrRequest?.response ? JSON.stringify(ocrRequest.response, null, 2) : t("loading")}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default OcrReviewPage;
