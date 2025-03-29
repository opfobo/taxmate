import OcrUpload from "@/components/ocr/OcrUpload";
import { useState } from "react";

const OcrTestPage = () => {
  const [ocrResult, setOcrResult] = useState<any | null>(null);

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">OCR Test Upload</h1>
      <OcrUpload
        onOcrResult={(result) => {
          console.log("OCR result:", result);
          setOcrResult(result);
        }}
      />
      {ocrResult && (
        <pre className="mt-6 p-4 bg-muted text-sm rounded overflow-auto max-h-[300px]">
          {JSON.stringify(ocrResult, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default OcrTestPage;
