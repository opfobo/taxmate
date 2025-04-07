
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import DocumentPreview from "@/components/ocr/DocumentPreview";

type OcrMapping = {
  id: string;
  status: string;
  file_name: string;
  file_path?: string;
  image_url?: string;
  response: any;
  created_at: string;
};

const OcrReviewPage = () => {
  const { ocrRequestId } = useParams<{ ocrRequestId: string }>();
  const [ocrData, setOcrData] = useState<OcrMapping | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalFileUrl, setOriginalFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
        toast({
          variant: "destructive",
          title: "Fehler beim Laden",
          description: "Die OCR-Daten konnten nicht geladen werden."
        });
      } else {
        console.log("Mapping-Data erhalten:", data);
        setOcrData(data);

        // Dynamisch Preview-Image URL holen, falls nicht vorhanden
        const previewPath = data.file_path?.replace(/\.[^/.]+$/, "_preview.jpg");
        if (previewPath) {
          const { data: previewData } = await supabase
            .storage
            .from("ocr-files")
            .createSignedUrl(previewPath, 600);
          if (previewData?.signedUrl) setPreviewUrl(previewData.signedUrl);
        }

        // Originaldatei-URL erzeugen
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
  }, [ocrRequestId, toast]);

  if (loading) return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="p-6 text-muted-foreground flex items-center justify-center h-[400px]">
        Lade OCR-Daten...
      </div>
    </div>
  );

  if (!ocrData) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="p-6 bg-destructive/10 text-destructive rounded-md">
          ⚠️ Kein Ergebnis geladen<br />
          OCR-ID: {ocrRequestId}<br />
          Prüfe RLS-Policy, Feld `response` und `file_path`
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">OCR Dokument-Prüfung</h1>
      <p className="text-muted-foreground mb-6">Dokument: {ocrData.file_name}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2 border-b">
            <CardTitle>Dokument</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {previewUrl ? (
              <div className="space-y-4">
                <AspectRatio ratio={4/3} className="overflow-hidden rounded-md border">
                  <DocumentPreview url={previewUrl} />
                </AspectRatio>
              
                {originalFileUrl && (
                  <div className="text-sm">
                    <a
                      href={originalFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      Originaldatei anzeigen
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground text-center p-8 border rounded-md">
                Keine Vorschau verfügbar
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 border-b">
            <CardTitle>Extrahierte Felder</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-sm bg-muted p-4 rounded overflow-auto max-h-[500px]">
              <pre className="whitespace-pre-wrap text-xs">
                {JSON.stringify(ocrData.response, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OcrReviewPage;
