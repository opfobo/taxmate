// components/ocr/DocumentPreview.tsx
import React from "react";
import { FileText, AlertTriangle } from "lucide-react";

interface DocumentPreviewProps {
  url: string | null;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ url }) => {
  if (!url) {
    return (
      <div className="flex flex-col items-center text-muted-foreground p-8">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p className="text-sm">Keine Vorschau verfügbar</p>
      </div>
    );
  }

  const isPDF = url.toLowerCase().endsWith(".pdf");
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(url);

  return (
    <div className="border rounded-md overflow-hidden w-full">
      {isPDF ? (
        <div className="aspect-[3/4] bg-muted flex flex-col items-center justify-center p-4 text-muted-foreground">
          <FileText className="h-10 w-10 mb-2" />
          <p className="text-xs">PDF-Datei</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary mt-2 hover:underline"
          >
            PDF im neuen Tab öffnen
          </a>
        </div>
      ) : isImage ? (
        <img
          src={url}
          alt="Dokumentenvorschau"
          className="max-w-full max-h-[600px] object-contain"
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
