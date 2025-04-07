
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type OcrMapping = {
  id: string;
  status: string;
  file_name: string;
  file_path?: string;
  image_url?: string;
  response: any;
  created_at: string;
  ocr_request_id?: string;
  user_id?: string;
  total_amount?: string;
  currency?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  customer_name?: string;
  customer_address?: string;
  confirmed_at?: string;
  line_items?: any;
};

const OcrReviewPage = () => {
  const { ocrRequestId } = useParams<{ ocrRequestId: string }>();
  const [ocrData, setOcrData] = useState<OcrMapping | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalFileUrl, setOriginalFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ocrRequestId) return;

    const fetchMapping = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("ocr_invoice_mappings")
        .select("*")
        .eq("ocr_request_id", ocrRequestId)
        .single();


      if (error) {
        console.error("Error loading OCR mapping:", error);
        setOcrData(null);
      } else {
        console.log("Mapping-Data erhalten:", data);
        // Convert the data to match OcrMapping type
        setOcrData({
          id: data.id || "",
          status: data.status || "",
          file_name: data.file_name || "",
          file_path: data.file_path,
          response: data.response,
          created_at: data.created_at,
          ocr_request_id: data.ocr_request_id,
          image_url: data.image_url,
          user_id: data.user_id,
          total_amount: data.total_amount,
          currency: data.currency,
          invoice_number: data.invoice_number,
          invoice_date: data.invoice_date,
          due_date: data.due_date,
          customer_name: data.customer_name,
          customer_address: data.customer_address,
          confirmed_at: data.confirmed_at,
          line_items: data.line_items
        });

        // Dynamically get preview image URL if not available
        const previewPath = data.file_path?.replace(/\.[^/.]+$/, "_preview.jpg");
        if (previewPath) {
          const { data: previewData } = await supabase
            .storage
            .from("ocr-files")
            .createSignedUrl(previewPath, 600);
          if (previewData?.signedUrl) setPreviewUrl(previewData.signedUrl);
        }

        // Create original file URL
        if (data.file_path) {
          const { data: fileData } = await supabase
            .storage
            .from("ocr-files")
            .createSignedUrl(data.file_path, 600);
          if (fileData?.signedUrl) setOriginalFileUrl(fileData.signedUrl);
        }
      }

      setLoading(false);
    };

    fetchMapping();
  }, [ocrRequestId]);

  if (loading) return <div className="p-6">Lade OCR-Daten...</div>;

  if (!ocrData) {
    return (
      <div className="p-6 text-red-600">
        ⚠️ Kein Ergebnis geladen<br />
        OCR-ID: {ocrRequestId}<br />
        Prüfe RLS-Policy, Feld `response` und `file_path`
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">OCR Review</h1>
      <p className="text-muted-foreground text-sm">Dokument: {ocrData.file_name}</p>

      {previewUrl && (
        <div className="border rounded-md overflow-hidden">
          <img
            src={previewUrl}
            alt="OCR Preview"
            className="w-full max-w-2xl rounded shadow"
          />
        </div>
      )}

      {originalFileUrl && (
        <div className="mt-2 text-sm">
          <a
            href={originalFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Originaldatei anzeigen ↗
          </a>
        </div>
      )}

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Extrahierte Felder (RAW)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm bg-muted p-4 rounded overflow-auto max-h-[400px]">
            <pre className="whitespace-pre-wrap text-xs">
              {JSON.stringify(ocrData.response, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OcrReviewPage;
