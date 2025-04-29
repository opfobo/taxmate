import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { PageLayout } from "@/components/common/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { Loader2, Save, Check, X, Edit, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import OcrDocumentPreview from "@/components/ocr/OcrDocumentPreview";
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
  const [editedLineItems, setEditedLineItems] = useState<any[]>([]);
  const [isInventorized, setIsInventorized] = useState(false);

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
    onSuccess: (data) => {
      if (data?.status === "inventory_created") setIsInventorized(true);
    },
  });

  useEffect(() => {
    if (invoiceMapping && Object.keys(invoiceMapping).length > 0) {
      setFormData(invoiceMapping);
    } else if (ocrRequest?.response) {
      const fallback = mapOcrInvoiceMapping(ocrRequest.response);
      setFormData(fallback);
    }
  }, [invoiceMapping, ocrRequest]);

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
    onSuccess: (data) => {
      setEditedLineItems(data);
    },
  });

  useEffect(() => {
    if (lineItems.length > 0) {
      setEditedLineItems(lineItems);
    }
  }, [lineItems]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (field === "default_tax_rate") {
      setEditedLineItems((prevItems) =>
        prevItems.map((item) => ({ ...item, tax_rate: value }))
      );
    }
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    setEditedLineItems((prevItems) => {
      const updated = [...prevItems];
      const currentItem = { ...updated[index], [field]: value };

      if (field === "quantity" && isEditing) {
        const qty = parseFloat(value);
        const unit = parseFloat(currentItem.unit_price);
        if (!isNaN(qty) && !isNaN(unit)) {
          currentItem.total_price = parseFloat((qty * unit).toFixed(2));
        }
      }

      if (field === "unit_price" && isEditing) {
        const qty = parseFloat(currentItem.quantity);
        const unit = parseFloat(value);
        if (!isNaN(qty) && !isNaN(unit)) {
          currentItem.total_price = parseFloat((qty * unit).toFixed(2));
        }
      }

      updated[index] = currentItem;
      return updated;
    });
  };

  const handleDeleteLineItem = (index: number) => {
  setEditedLineItems((prevItems) => {
    const updated = [...prevItems];
    updated.splice(index, 1); // Entfernt 1 Element an Stelle index
    return updated.map((item, idx) => ({
      ...item,
      item_index: idx + 1, // Neu indexieren
    }));
  });
};


  const handleAddLineItem = () => {
  setEditedLineItems((prevItems) => [
    ...prevItems,
    {
      id: crypto.randomUUID(),
      mapping_id: invoiceMapping?.id ?? "",
      item_index: prevItems.length + 1,
      description: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      tax_rate: formData.default_tax_rate ?? null,
      isNew: true, // Flag für später wenn gebraucht
    },
  ]);
};


const handleSubmit = async () => {
  if (!invoiceMapping?.id) return;

  // Nur erlaubte Felder, keine default_tax_rate (das Feld existiert nicht in DB)
  const allowedKeys = [
    "invoice_number",
    "invoice_date",
    "total_amount",
    "total_tax",
    "supplier_name",
    "supplier_address",
    "supplier_vat",
    "comment"
  ];

  const cleanedFormData: Record<string, any> = {};
  allowedKeys.forEach((key) => {
    if (formData[key] !== undefined && formData[key] !== null) {
      cleanedFormData[key] = formData[key];
    }
  });

  const { error: updateError } = await supabase
    .from("ocr_invoice_mappings")
    .update(cleanedFormData)
    .eq("id", invoiceMapping.id);

  if (updateError) {
    toast({
      title: "Fehler beim Speichern",
      description: updateError.message,
      variant: "destructive",
    });
    return;
  }

  const { error: itemError } = await supabase
    .from("ocr_invoice_items")
    .upsert(editedLineItems);

  if (itemError) {
    toast({
      title: "Fehler bei Positionen",
      description: itemError.message,
      variant: "destructive",
    });
    return;
  }

  toast({
    title: "Gespeichert",
    description: "Alle Änderungen wurden erfolgreich übernommen.",
  });

  setIsEditing(false);
};


  const handleTransferToInventory = async () => {
    if (!invoiceMapping?.id || isInventorized) return;

    try {
      const { data: lineItems, error } = await supabase
        .from("ocr_invoice_items")
        .select("*")
        .eq("mapping_id", invoiceMapping.id);

      if (error || !lineItems) throw error;

      const itemsToInsert = lineItems.map((item: any) => ({
        ocr_item_id: item.id,
        ocr_mapping_id: invoiceMapping.id,
        source_file: ocrRequest?.file_name ?? "",
        invoice_date: formData.invoice_date,
        supplier_name: formData.supplier_name,
        supplier_vat: formData.supplier_vat,
        item_index: item.item_index,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        tax_rate: item.tax_rate,
        comment: formData.comment ?? null,
      }));

      const { error: insertError } = await supabase
        .from("inventory_items")
        .insert(itemsToInsert);

      if (insertError) throw insertError;

      await supabase
        .from("ocr_invoice_mappings")
        .update({ status: "inventory_created" })
        .eq("id", invoiceMapping.id);

      toast({
        title: "Inventar übernommen",
        description: "Die OCR-Positionen wurden ins Inventar übertragen.",
      });

      setIsInventorized(true);
    } catch (err: any) {
      console.error("Inventarübernahme fehlgeschlagen:", err);
      toast({
        title: "Fehler",
        description: err?.message ?? "Unbekannter Fehler bei Inventarübernahme.",
        variant: "destructive",
      });
    }
  };

  const isLoading = isLoadingRequest || isLoadingMapping;

  return (
    <PageLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">OCR Prüfung</h1>
          <div className="space-x-2">
            {!isEditing && !isInventorized && (
              <Button variant="secondary" onClick={handleTransferToInventory}>
                <Plus className="mr-2 h-4 w-4" /> In Inventar übernehmen
              </Button>
            )}
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => {
                  setFormData(invoiceMapping ?? {});
                  setEditedLineItems(lineItems ?? []);
                  setIsEditing(false);
                }}>
                  <X className="mr-2 h-4 w-4" /> Abbrechen
                </Button>
                <Button onClick={handleSubmit}>
                  <Save className="mr-2 h-4 w-4" /> Speichern
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" /> Bearbeiten
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
              <CardContent className="sticky top-24 pt-6">
                <OcrDocumentPreview
                  filePath={invoiceMapping?.file_path ?? ""}
                  fileName={ocrRequest?.file_name ?? ""}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rechnungsdetails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Kommentar (optional)</div>
                  <EditableText value={formData.comment} onChange={(val) => handleChange("comment", val)} isEditing={isEditing} />

                  <div className="text-muted-foreground">Rechnungsnummer</div>
                  <EditableText value={formData.invoice_number} onChange={(val) => handleChange("invoice_number", val)} isEditing={isEditing} />

                  <div className="text-muted-foreground">Rechnungsdatum</div>
                  <EditableText value={formData.invoice_date} onChange={(val) => handleChange("invoice_date", val)} isEditing={isEditing} />

                  <div className="text-muted-foreground">Gesamtbetrag</div>
                  <EditableCurrency value={formData.total_amount} onChange={(val) => handleChange("total_amount", val)} isEditing={isEditing} />

                  <div className="text-muted-foreground">USt. enthalten</div>
                  <EditableCurrency value={formData.total_tax} onChange={(val) => handleChange("total_tax", val)} isEditing={isEditing} />

                  <div className="text-muted-foreground">USt.-Satz</div>
                  <TaxRateSelector value={formData.default_tax_rate} onChange={(val) => handleChange("default_tax_rate", val)} isEditing={isEditing} />

                  <div className="text-muted-foreground">Lieferant</div>
                  <EditableText value={formData.supplier_name} onChange={(val) => handleChange("supplier_name", val)} isEditing={isEditing} />

                  <div className="text-muted-foreground">Adresse</div>
                  <EditableText value={formData.supplier_address} onChange={(val) => handleChange("supplier_address", val)} isEditing={isEditing} />

                  <div className="text-muted-foreground">USt.-ID</div>
                  <EditableText value={formData.supplier_vat} onChange={(val) => handleChange("supplier_vat", val)} isEditing={isEditing} />
                </div>

                <Separator />

                <h3 className="font-semibold mb-2">Positionen</h3>
                <div className="grid grid-cols-12 gap-2 text-sm font-medium mb-1">
                  <div className="col-span-1">#</div>
                  <div className="col-span-1">Menge</div>
                  <div className="col-span-4">Beschreibung</div>
                  <div className="col-span-2">Einzelpreis</div>
                  <div className="col-span-2">Gesamt</div>
                  <div className="col-span-2">USt.</div>
                </div>

                {editedLineItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 text-sm border-b py-1 items-center">
                    <div className="col-span-1">{item.item_index ?? index + 1}</div>
                    <div className="col-span-1">
                      <EditableText value={item.quantity} onChange={(val) => handleLineItemChange(index, "quantity", val)} isEditing={isEditing} />
                    </div>
                    <div className="col-span-4">
                      <EditableText value={item.description} onChange={(val) => handleLineItemChange(index, "description", val)} isEditing={isEditing} />
                    </div>
                    <div className="col-span-2">
                      <EditableCurrency value={item.unit_price} onChange={(val) => handleLineItemChange(index, "unit_price", val)} isEditing={isEditing} />
                    </div>
                    <div className="col-span-2">
                      <EditableCurrency value={item.total_price} onChange={(val) => handleLineItemChange(index, "total_price", val)} isEditing={isEditing} />
                    </div>
                    <div className="col-span-2">
                      <TaxRateSelector value={item.tax_rate} onChange={(val) => handleLineItemChange(index, "tax_rate", val)} isEditing={isEditing} />
                    </div>
                    {isEditing && (
  <div className="col-span-1 flex justify-center">
    <Button
      variant="ghost"
      size="icon"
      onClick={() => handleDeleteLineItem(index)}
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
)}

                  </div>
                ))}
                {isEditing && (
  <Button variant="outline" size="sm" onClick={handleAddLineItem}>
    <Plus className="mr-2 h-4 w-4" size={16} /> Neue Position hinzufügen
  </Button>
)}

              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default OcrReviewPage;
