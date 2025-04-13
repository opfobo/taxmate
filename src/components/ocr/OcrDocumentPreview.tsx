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
    if (imageUrl) {
      setPreviewUrl(imageUrl);
      return;
    }

    if (!filePath) {
      setError("Kein Pfad angegeben");
      return;
    }

    const isPdf = filePath.toLowerCase().endsWith(".pdf");
    const previewPath = isPdf
      ? filePath.replace(/\.pdf$/i, "_preview.jpg")
      : filePath;

    const fetchUrls = async () => {
      try {
        const [{ data: previewData, error: previewError }, { data: originalData, error: originalError }] =
          await Promise.all([
            supabase.storage.from("ocr-files").createSignedUrl(previewPath, 60),
            supabase.storage.from("ocr-files").createSignedUrl(filePath, 60)
          ]);

        if (previewError || !previewData) {
          setError("Keine Vorschau verfügbar");
        } else {
          setPreviewUrl(previewData.signedUrl);
        }

        if (!originalError && originalData) {
          setOriginalUrl(originalData.signedUrl);
        }
      } catch (err) {
        console.error("❌ Vorschaufehler:", err);
        setError("Fehler beim Laden der Vorschau.");
      }
    };

    fetchUrls();
  }, [filePath, imageUrl]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">
        {fileName ?? "ocr.document_preview"}
      </h3>

      {previewUrl ? (
        <div
          className="relative overflow-hidden rounded group w-full max-w-sm aspect-video border"
          onMouseMove={(e) => {
            const img = e.currentTarget.querySelector("img") as HTMLImageElement;
            if (!img) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            img.style.transformOrigin = `${x}% ${y}%`;
          }}
        >
          <img
            src={previewUrl}
            alt="Preview"
            className="object-contain w-full h-full transition-transform duration-300 ease-in-out scale-100 group-hover:scale-[2]"
          />
        </div>
      ) : (
        <div className="text-sm text-muted-foreground flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error || "Keine Vorschau verfügbar"}</span>
        </div>
      )}

      {originalUrl && filePath?.toLowerCase().endsWith(".pdf") && (
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 underline"
        >
          Original PDF öffnen
        </a>
      )}
    </div>
  );
};

export default OcrDocumentPreview;
