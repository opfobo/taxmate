import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { mapOcrInvoiceMapping, mapOcrInvoiceLineItems } from "@/lib/ocr/OcrInvoiceMappings";
import { Loader2 } from "lucide-react";

const OcrInvoiceReview = () => {
  const { ocrRequestId } = useParams<{ ocrRequestId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mappedInvoice, setMappedInvoice] = useState<any | null>(null);
  const [mappedItems, setMappedItems] = useState<any[] | null>(null);

  useEffect(() => {
    const fetchOcrData = async () => {
      if (!ocrRequestId) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("ocr_requests")
        .select("response")
        .eq("id", ocrRequestId)
        .single();

      if (error || !data?.response) {
        setError("OCR response not found.");
        setLoading(false);
        return;
      }

      const mapped = mapOcrInvoiceMapping(data.response);
      const items = mapOcrInvoiceLineItems(data.response);

      setMappedInvoice(mapped);
      setMappedItems(items);
      setLoading(false);
    };

    fetchOcrData();
  }, [ocrRequestId]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Lade OCR-Daten ...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive text-sm">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">OCR Invoice Review</h1>

      <pre className="bg-muted text-sm p-4 rounded">
        {JSON.stringify(mappedInvoice, null, 2)}
      </pre>

      <h2 className="text-lg font-semibold">Rechnungspositionen</h2>
      <pre className="bg-muted text-sm p-4 rounded">
        {JSON.stringify(mappedItems, null, 2)}
      </pre>
    </div>
  );
};

export default OcrInvoiceReview;
