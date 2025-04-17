// components/ocr/DocumentPreview.tsx
import React, { useEffect, useRef } from "react";
import { FileText, AlertTriangle } from "lucide-react";

interface DocumentPreviewProps {
  url: string | null;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ url }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isPDF = url?.toLowerCase().endsWith(".pdf");
  const isImage = url ? /\.(jpg|jpeg|png|webp)$/i.test(url) : false;

  useEffect(() => {
    if (!url || !isPDF || !canvasRef.current) return;

    const loadPdf = async () => {
      // Dynamisch PDF.js laden (über CDN)
      // @ts-ignore
      const pdfjsLib = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");

      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
    };

    loadPdf().catch((err) => {
      console.error("PDF render error:", err);
    });
  }, [url, isPDF]);

  if (!url) {
    return (
      <div className="flex flex-col items-center text-muted-foreground p-8">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p className="text-sm">Keine Vorschau verfügbar</p>
      </div>
    );
  }

  return (
    <div className="group relative w-full max-w-2xl border rounded-md overflow-hidden">
  {isPDF ? (
    <>
      <canvas
        ref={canvasRef}
        className="transition-transform duration-300 ease-in-out group-hover:scale-150"
        style={{ maxWidth: "100%", maxHeight: "600px" }}
      />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 left-2 text-xs text-primary hover:underline bg-white/80 p-1 rounded"
      >
        PDF im neuen Tab öffnen
      </a>
    </>
  ) : isImage ? (
    <img
      src={url}
      alt="Dokumentenvorschau"
      className="w-full transition-transform duration-300 ease-in-out group-hover:scale-150"
      style={{ maxHeight: "600px", objectFit: "contain" }}
    />
  ) : (
    <div className="p-4 text-sm text-muted-foreground text-center">
      Format nicht unterstützt: <code>{url}</code>
    </div>
  )}
</div>

  );
};

export default DocumentPreview;
