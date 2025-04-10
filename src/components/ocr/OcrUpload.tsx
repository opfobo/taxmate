import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/context/AuthContext";
import { PDF_PREVIEW_BASE_URL } from "@/constants/config";
import { getApiKey } from "@/lib/supabase/helpers/getApiKey"; // Updated path

const MINDEE_API_URL = "https://api.mindee.net/v1/products/mindee/invoices/v4/predict";

export interface OcrUploadProps {
  onOcrResult: (result: any) => void;
  label?: string;
  mimeTypes?: string[];
  fileSizeLimitMB?: number;
}

export const OcrUpload = ({
  onOcrResult,
  label = "Upload document for OCR",
  mimeTypes = ["application/pdf", "image/jpeg", "image/png"],
  fileSizeLimitMB = 10,
}: OcrUploadProps) => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [safeFileName, setSafeFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const fetchTokens = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('ocr_tokens')
      .select('tokens')
      .eq('user_id', user.id)
      .single();
    if (!error) setTokens(data?.tokens || 0);
  };

  useEffect(() => {
    fetchTokens();
  }, [user]);

  const resetStates = () => {
    setIsUploading(false);
    setIsProcessing(false);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);
    setFile(null);
    setFileName(null);
    setSafeFileName(null);
    setRequestId(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processOcrResult = async (result: any, requestId: string, safeFileName: string) => {
    if (!user) return;
    try {
      const prediction = result.document.inference.prediction;
      const invoiceNumber = prediction.invoice_number?.value || null;
      const invoiceDate = prediction.date?.value || null;
      const totalAmount = prediction.total_amount?.value || null;
      const totalNet = prediction.total_net?.value || null;
      const totalTax = prediction.total_tax?.value || null;
      const supplierName = prediction.supplier_name?.value || null;
      const supplierAddress = prediction.supplier_address?.value || null;
      const customerName = prediction.customer_name?.value || null;
      const customerAddress = prediction.customer_address?.value || null;
      const lineItems = prediction.line_items?.map((item: any, index: number) => ({
        id: uuidv4(),
        description: item.description || `Item ${index + 1}`,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total_amount: item.total_amount || 0
      })) || [];

      const { data: mappingData, error: mappingError } = await supabase
        .from('ocr_invoice_mappings')
        .insert({
          user_id: user.id,
          ocr_request_id: requestId,
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate,
          supplier_name: supplierName,
          supplier_address: supplierAddress,
          supplier_vat: null,
          customer_name: customerName,
          customer_address: customerAddress,
          total_amount: totalAmount,
          total_tax: totalTax,
          total_net: totalNet,
          currency: prediction.locale?.currency || 'EUR',
          line_items: lineItems,
          file_path: `${user.id}/${safeFileName}`,
          status: 'pending'
        })
        .select('id')
        .single();

      if (mappingError) throw new Error(`Failed to create invoice mapping: ${mappingError.message}`);

      return mappingData.id;
    } catch (err: any) {
      console.error('Error processing OCR result:', err);
      throw err;
    }
  };

  const sendToPdfPreviewServer = async (file: File) => {
    if (!file || !file.name.endsWith(".pdf")) return null;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("https://pcgs.ru/pdfserver/convert", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Preview conversion failed");
      console.log("📷 Preview conversion result:", json);
      return json;
    } catch (err) {
      console.warn("❌ PDF Preview server error:", err);
      return null;
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const inputElement = e.target as HTMLInputElement;
    if (!inputElement.files || inputElement.files.length === 0) return;
    const selectedFile = inputElement.files[0];

    resetStates();
    setIsUploading(true);
    setFile(selectedFile);

    if (!user) {
      setError("You must be logged in.");
      toast({ title: "Login required", variant: "destructive" });
      return;
    }

    if (tokens !== null && tokens < 1) {
      setError("No tokens left.");
      toast({ title: "OCR quota exceeded", variant: "destructive" });
      return;
    }

    const normalizedType =
      selectedFile.type === "application/octet-stream" && selectedFile.name.endsWith(".pdf")
        ? "application/pdf"
        : selectedFile.type;

    if (!mimeTypes.includes(normalizedType)) {
      setError("Invalid file type");
      return;
    }

    if (selectedFile.size / (1024 * 1024) > fileSizeLimitMB) {
      setError("File too large");
      return;
    }

    setFileName(selectedFile.name);
    const fileExtension = selectedFile.name.split(".").pop();
    const timestamp = Date.now();
    const uniqueId = uuidv4().substring(0, 8);
    const generatedSafeFileName = `ocr_${timestamp}_${uniqueId}.${fileExtension}`;
    const securePath = `${user.id}/${generatedSafeFileName}`;

    setSafeFileName(generatedSafeFileName);

// PDF-Konvertierung und Upload in ocr-files
if (selectedFile.type === "application/pdf") {
  const previewResponse = await sendToPdfPreviewServer(selectedFile);
  if (previewResponse?.success && previewResponse.images?.length > 0) {
    const rawFilename = previewResponse.images[0];
    const jpegFilename = rawFilename.split("/").pop();
    const jpegUrl = `${PDF_PREVIEW_BASE_URL}${jpegFilename}`;
    try {
      const jpegRes = await fetch(jpegUrl);
      if (!jpegRes.ok) {
  console.warn("JPEG preview fetch failed:", jpegRes.status, jpegUrl);
  throw new Error("Failed to fetch preview image from server");
}
      const jpegBlob = await jpegRes.blob();

      const previewPath = `${user.id}/${generatedSafeFileName.replace(/\.[^/.]+$/, "_preview.jpg")}`;
      const { error: uploadError } = await supabase.storage
        .from("ocr-files")
        .upload(previewPath, jpegBlob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (!uploadError) {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("ocr-files")
          .createSignedUrl(previewPath, 600);
        if (!signedUrlError && signedUrlData?.signedUrl) {
          setPreviewUrl(signedUrlData.signedUrl);
          setIsUploading(false);
        }
      }
    } catch (err) {
      console.warn("⚠️ JPEG fetch/upload error:", err);
    }
  }
}

// Bilder: Base64-Vorschau + Upload in ocr-images + signed URL holen
if (selectedFile.type.startsWith("image/")) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target?.result as string;
    setPreviewUrl(base64);

    const imagePath = `${user.id}/${generatedSafeFileName}`;
    const { error: imageUploadError } = await supabase.storage
      .from("ocr-images")
      .upload(imagePath, selectedFile, {
        contentType: selectedFile.type,
        upsert: true,
      });

    if (!imageUploadError) {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("ocr-images")
        .createSignedUrl(imagePath, 600);
      if (!signedUrlError && signedUrlData?.signedUrl) {
        setPreviewUrl(signedUrlData.signedUrl);
      }
    }

    setIsUploading(false);
  };
  reader.readAsDataURL(selectedFile);
}


    
    const { data: requestData, error: requestError } = await supabase
      .from('ocr_requests')
      .insert({
        user_id: user.id,
        file_name: generatedSafeFileName,
        status: 'pending'
      })
      .select('id')
      .single();

    if (requestError) {
      setError("Failed to create OCR request");
      return;
    }

    setRequestId(requestData.id);

    // Vorschau vorbereiten (PDF → JPEG)


    // Datei hochladen (aber noch kein OCR!)
    const { error: uploadError } = await supabase.storage
      .from("ocr-files")
      .upload(securePath, selectedFile, { upsert: true });

    if (uploadError) {
      setError("File upload failed");
    }
  };

  const handleOcrStart = async () => {
    if (!file || !safeFileName || !requestId || !user) return;

    try {
      setIsProcessing(true);
      const formData = new FormData();
      formData.append("document", file);

      const mindeeKey = await getApiKey("mindee");

if (!mindeeKey) {
  setError("Kein gültiger Mindee-API-Key gefunden.");
  toast({
    title: "Fehlender API-Key",
    description: "Bitte überprüfe die Konfiguration für OCR.",
    variant: "destructive",
  });
  return;
}

const mindeeResponse = await fetch(MINDEE_API_URL, {
  method: "POST",
  headers: {
    Authorization: `Token ${mindeeKey}`
  },
  body: formData
});


      const result = await mindeeResponse.json();
      if (!mindeeResponse.ok) {
        throw new Error(result.api_request?.error?.message || "Mindee OCR failed");
      }

      await supabase.rpc('decrement_ocr_token', { uid: user.id });
      setTokens(prev => prev !== null ? prev - 1 : null);

      await supabase.from('ocr_requests').update({
        status: 'success',
        response: result,
        processed_at: new Date().toISOString()
      }).eq('id', requestId);

      await processOcrResult(result, requestId, safeFileName);

      onOcrResult(result);
      setSuccess(true);
      toast({ title: "OCR completed", description: "Document processed successfully." });
      navigate(`/dashboard/ocr/review/${requestId}`);
    } catch (err: any) {
      setError(err.message);
      toast({ title: "OCR failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      {label && <p className="text-sm font-medium mb-1.5">{label}</p>}
      {tokens !== null && (
        <div className="text-xs text-muted-foreground mb-2">
          Available OCR tokens: <span className={tokens < 3 ? "text-amber-500 font-medium" : ""}>{tokens}</span>
        </div>
      )}

      <div className="flex flex-col items-center space-y-4">
        {!isUploading && !isProcessing && !success && (
          <div className="w-full">
            <Input
              type="file"
              ref={fileInputRef}
              accept={mimeTypes.join(",")}
              onChange={handleFileChange}
              disabled={isUploading || isProcessing || (tokens !== null && tokens < 1) || !user}
              className={`cursor-pointer ${error ? "border-destructive" : ""}`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Accepted formats: {mimeTypes.map(type => type.split('/')[1]).join(', ')} (Max {fileSizeLimitMB}MB)
            </p>
          </div>
        )}

        {isUploading && (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm">Uploading...</span>
          </div>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm">Processing...</span>
          </div>
        )}

        {previewUrl && (
          <div
  className="relative overflow-hidden rounded group w-full max-w-sm aspect-video"
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
    src={previewUrl ?? ""}
    alt="Preview"
    className="object-contain w-full h-full transition-transform duration-300 ease-in-out scale-100 group-hover:scale-[2]"
  />
</div>

        )}

        {file && !success && !isProcessing && (
          <Button onClick={handleOcrStart} disabled={!tokens || tokens < 1} className="mt-3">
            OCR starten
          </Button>
        )}

        {fileName && !previewUrl && (
          <div className="flex items-center space-x-2 p-2 bg-muted rounded">
            {fileName.toLowerCase().endsWith('.pdf') ? (
              <FileText className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="text-sm truncate max-w-[200px]">{fileName}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">OCR result received</span>
            </div>
            <Button variant="outline" size="sm" onClick={resetStates}>
              <Upload className="h-4 w-4 mr-2" />
              Upload another document
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OcrUpload;
