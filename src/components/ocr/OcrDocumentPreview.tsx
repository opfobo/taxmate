import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";

interface OcrDocumentPreviewProps {
  filePath?: string; // Make optional
  imageUrl?: string; // Add imageUrl prop
  fileName?: string; // Add fileName prop
}

const OcrDocumentPreview = ({ filePath, imageUrl, fileName }: OcrDocumentPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If imageUrl is provided directly, use it
    if (imageUrl) {
      setPreviewUrl(imageUrl);
      return;
    }

    // Otherwise try to fetch from storage using filePath
    if (!filePath) {
      setError("No file path or image URL provided");
      return;
    }

    const fetchUrls = async () => {
      try {
        const previewPath = filePath.replace(".pdf", "_preview.jpg");

        const { data: previewSigned, error: previewError } = await supabase.storage
          .from("ocr-files")
          .createSignedUrl(previewPath, 60);

        const { data: originalSigned, error: originalError } = await supabase.storage
          .from("ocr-files")
          .createSignedUrl(filePath, 60);

        if (previewError || !previewSigned) {
          setError("Keine Vorschau verfügbar");
        } else {
          setPreviewUrl(previewSigned.signedUrl);
        }

        if (!originalError && originalSigned) {
          setOriginalUrl(originalSigned.signedUrl);
        }
      } catch (err) {
        console.error("Fehler beim Laden der Vorschau:", err);
        setError("Vorschau konnte nicht geladen werden.");
      }
    };

    fetchUrls();
  }, [filePath, imageUrl]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">
        {fileName ? fileName : "ocr.document_preview"}
      </h3>
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
