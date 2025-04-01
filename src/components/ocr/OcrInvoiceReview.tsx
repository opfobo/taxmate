
// Fixing the currency type error
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Check, Clock, FileText, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type Currency = "EUR" | "USD" | "GBP";

// Define a schema for the form values
const invoiceFormSchema = z.object({
  invoice_number: z.string().optional(),
  invoice_date: z.string().optional(),
  supplier_name: z.string().min(1, "Supplier name is required"),
  supplier_address: z.string().optional(),
  supplier_vat: z.string().optional(),
  total_amount: z.number().positive("Amount must be positive"),
  total_tax: z.number().min(0, "Tax cannot be negative").optional(),
  currency: z.enum(["EUR", "USD", "GBP"] as const),
  notes: z.string().optional()
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

const OcrInvoiceReview = () => {
  const { t } = useTranslation();
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [invoiceMapping, setInvoiceMapping] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoice_number: "",
      invoice_date: "",
      supplier_name: "",
      supplier_address: "",
      supplier_vat: "",
      total_amount: 0,
      total_tax: 0,
      currency: "EUR" as Currency,  // Explicitly type as Currency
      notes: ""
    }
  });
  
useEffect(() => {
  let didCancel = false;
  console.log("🔄 useEffect triggered");

  const fetchOcrResult = async () => {
    if (!requestId) {
      console.log("❌ No requestId found – aborting");
      return;
    }

    console.log("📥 Fetching OCR data for requestId:", requestId);
    setIsLoading(true);

    try {
      const { data: requestData, error: requestError } = await supabase
        .from("ocr_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (requestError || !requestData) {
        console.error("❗ Request fetch error:", requestError);
        if (!didCancel) {
          setIsLoading(false);
          toast({ title: t("error"), description: t("ocr.error_fetching_results"), variant: "destructive" });
        }
        return;
      }

      const fileName = requestData.file_name;
      const { publicUrl } = supabase.storage.from("ocr-temp").getPublicUrl(fileName);

      if (!didCancel && publicUrl !== previewUrl) {
        console.log("📄 Setting preview URL:", publicUrl);
        setPreviewUrl(publicUrl);
      }

      const { data: mappingData, error: mappingError } = await supabase
        .from("ocr_invoice_mappings")
        .select("*")
        .eq("ocr_request_id", requestId)
        .single();

      if (mappingError && mappingError.code !== "PGRST116") {
        console.error("❗ Mapping fetch error:", mappingError);
      }

      if (mappingData && !didCancel) {
        console.log("✅ Mapping data loaded:", mappingData);

        // Vergleiche vorherigen Zustand, um reset() nicht unnötig zu triggern
        const currentValues = form.getValues();
        const newValues = {
          invoice_number: mappingData.invoice_number || "",
          invoice_date: mappingData.invoice_date || "",
          supplier_name: mappingData.supplier_name || "",
          supplier_address: mappingData.supplier_address || "",
          supplier_vat: mappingData.supplier_vat || "",
          total_amount: mappingData.total_amount || 0,
          total_tax: mappingData.total_tax || 0,
          currency: (mappingData.currency as Currency) || "EUR",
          notes: "",
        };

        const isDifferent = JSON.stringify(currentValues) !== JSON.stringify(newValues);
        console.log("🧪 Should reset form?", isDifferent);

        if (isDifferent) {
          form.reset(newValues);;
        }

        setInvoiceMapping(mappingData);
      }

      if (!didCancel) {
        setOcrResult(requestData.response);
        setIsLoading(false);
      }

    } catch (error: any) {
      if (!didCancel) {
        console.error("🔥 Fatal error in fetchOcrResult:", error);
        toast({ title: t("error"), description: t("ocr.error_fetching_results"), variant: "destructive" });
        setIsLoading(false);
      }
    }
  };

  fetchOcrResult();

  return () => {
    console.log("🛑 useEffect cleanup");
    didCancel = true;
  };
}, [requestId, t]); // ✅ KEIN "form" hier!
  
  const handleSaveInvoice = async (values: InvoiceFormValues) => {
    if (!requestId) return;
    
    setIsSaving(true);
    
    try {
      // Update invoice mapping
      if (invoiceMapping?.id) {
        const { error } = await supabase
          .from('ocr_invoice_mappings')
          .update({
            invoice_number: values.invoice_number,
            invoice_date: values.invoice_date,
            supplier_name: values.supplier_name,
            supplier_address: values.supplier_address,
            supplier_vat: values.supplier_vat,
            total_amount: values.total_amount,
            total_tax: values.total_tax,
            currency: values.currency,
            notes: values.notes,
            status: 'reviewed',
            updated_at: new Date().toISOString()
          })
          .eq('id', invoiceMapping.id);
          
        if (error) throw error;
      }
      
      // Here you would typically create an invoice in your system
      // or navigate to the invoice creation page with prefilled data
      
      toast({
        title: t("success"),
        description: t("ocr.invoice_saved")
      });
      
      // Navigate to appropriate page
      navigate("/dashboard/orders");
      
    } catch (error: any) {
      console.error("Error saving invoice:", error);
      toast({
        title: t("error"),
        description: error.message || t("ocr.error_saving_invoice"),
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>{t("ocr.loading_results")}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/ocr")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Button>
        
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {t("ocr.processed_at")} {new Date().toLocaleString()}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("ocr.review_extracted_data")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form id="invoice-form" onSubmit={form.handleSubmit(handleSaveInvoice)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_number">{t("ocr.invoice_number")}</Label>
                    <Input 
                      id="invoice_number"
                      {...form.register("invoice_number")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invoice_date">{t("ocr.invoice_date")}</Label>
                    <Input 
                      id="invoice_date"
                      type="date"
                      {...form.register("invoice_date")}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplier_name">{t("ocr.supplier_name")}</Label>
                  <Input 
                    id="supplier_name"
                    {...form.register("supplier_name")}
                  />
                  {form.formState.errors.supplier_name && (
                    <p className="text-xs text-destructive">{form.formState.errors.supplier_name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplier_address">{t("ocr.supplier_address")}</Label>
                  <Textarea 
                    id="supplier_address"
                    {...form.register("supplier_address")}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplier_vat">{t("ocr.supplier_vat")}</Label>
                  <Input 
                    id="supplier_vat"
                    {...form.register("supplier_vat")}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total_amount">{t("ocr.total_amount")}</Label>
                    <Input 
                      id="total_amount"
                      type="number"
                      step="0.01"
                      {...form.register("total_amount", {
                        valueAsNumber: true
                      })}
                    />
                    {form.formState.errors.total_amount && (
                      <p className="text-xs text-destructive">{form.formState.errors.total_amount.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="total_tax">{t("ocr.total_tax")}</Label>
                    <Input 
                      id="total_tax"
                      type="number"
                      step="0.01"
                      {...form.register("total_tax", {
                        valueAsNumber: true
                      })}
                    />
                    {form.formState.errors.total_tax && (
                      <p className="text-xs text-destructive">{form.formState.errors.total_tax.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">{t("ocr.currency")}</Label>
                    <Select
                      onValueChange={(value: Currency) => form.setValue("currency", value)}
                      defaultValue={form.getValues("currency")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("ocr.select_currency")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">{t("ocr.notes")}</Label>
                  <Textarea 
                    id="notes"
                    {...form.register("notes")}
                    rows={2}
                    placeholder={t("ocr.notes_placeholder")}
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate("/ocr")}>
                {t("cancel")}
              </Button>
              <Button 
                type="submit"
                form="invoice-form"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("ocr.saving")}
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {t("ocr.save_invoice")}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t("ocr.document_preview")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {previewUrl ? (
                <div className="border rounded-md overflow-hidden">
                  {previewUrl.toLowerCase().endsWith('.pdf') ? (
                    <div className="aspect-[3/4] bg-muted flex items-center justify-center p-4">
                      <div className="flex flex-col items-center text-muted-foreground">
                        <FileText className="h-10 w-10 mb-2" />
                        <p className="text-xs">{t("ocr.pdf_preview")}</p>
                        <a 
                          href={previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary mt-2 hover:underline"
                        >
                          {t("ocr.open_pdf")}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={previewUrl} 
                      alt="Document Preview"
                      className="max-w-full object-contain"
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center text-muted-foreground p-8">
                  <AlertTriangle className="h-8 w-8 mb-2" />
                  <p className="text-sm">{t("ocr.no_preview_available")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OcrInvoiceReview;
