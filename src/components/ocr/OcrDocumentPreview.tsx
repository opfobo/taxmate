import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";

interface OcrDocumentPreviewProps {
  filePath?: string;
  imageUrl?: string;
  fileName?: string;
}

const OcrDocumentPreview = ({ filePath, imageUrl, fileName }: OcrDocumentPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrls = async () => {
      if ((!filePath || filePath === "") && (!imageUrl || imageUrl === "")) {
        setError("Kein Pfad oder Bild-URL angegeben");
        return;
      }

      if (imageUrl && !filePath) {
        setPreviewUrl(imageUrl);
        return;
      }

      try {
        const previewPath = filePath!.replace(/\.pdf$/i, "_preview.jpg");

        const { data: previewData, error: previewError } = await supabase.storage
          .from("ocr-files")
          .createSignedUrl(previewPath, 3600);

        if (previewError || !previewData?.signedUrl) {
          console.warn("❌ Fehler beim Laden der Vorschau:", previewError);
          setError("Keine Vorschau verfügbar");
        } else {
          setPreviewUrl(previewData.signedUrl);
        }

        const { data: originalData, error: originalError } = await supabase.storage
          .from("ocr-files")
          .createSignedUrl(filePath!, 3600);

        if (!originalError && originalData?.signedUrl) {
          setOriginalUrl(originalData.signedUrl);
        }
      } catch (err) {
        console.error("❌ Vorschau konnte nicht geladen werden:", err);
        setError("Fehler beim Laden der Vorschau");
      }
    };

    fetchUrls();
  }, [filePath, imageUrl]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{fileName ?? "ocr.document_preview"}</h3>

      {previewUrl ? (
        <div className="border rounded-md overflow-hidden group">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full object-contain transition-transform duration-300 ease-in-out group-hover:scale-125"
          />
        </div>
      ) : (
        <div className="text-sm text-muted-foreground flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error || "Keine Vorschau verfügbar"}</span>
        </div>
      )}

      {originalUrl && (
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 underline"
        >
          Originaldokument öffnen
        </a>
      )}
    </div>
  );
};

export default OcrDocumentPreview;
