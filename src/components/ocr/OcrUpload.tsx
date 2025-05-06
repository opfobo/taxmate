
import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { PDF_PREVIEW_BASE_URL } from "@/constants/config";
import { getApiKey } from "@/lib/supabase/helpers/getApiKey";
import { mapOcrInvoiceMapping, mapOcrInvoiceLineItems} from "@/lib/ocr/OcrInvoiceMappings";

const MINDEE_API_URL = "https://api.mindee.net/v1/products/mindee/invoices/v4/predict";

export interface OcrUploadProps {
  onOcrResult: (result: any) => void;
  label?: string;
  mimeTypes?: string[];
  fileSizeLimitMB?: number;
}

export const OcrUpload = ({
  onOcrResult,
  label,
  mimeTypes = ["application/pdf", "image/jpeg", "image/png"],
  fileSizeLimitMB = 10,
}: OcrUploadProps) => {
  const { t } = useTranslation();
  const displayLabel = label ?? t("ocr_upload.label");

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
  const [duplicateInfo, setDuplicateInfo] = useState<any | null>(null);

  const fetchTokens = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("ocr_tokens")
      .select("tokens")
      .eq("user_id", user.id)
      .single();
    if (!error) setTokens(data?.tokens || 0);
  };

  const [recentOcrFiles, setRecentOcrFiles] = useState<any[]>([]);
const [ocrFetchLimit, setOcrFetchLimit] = useState(5);
const fetchRecentOcrFiles = async () => {
  if (!user) return;
  const { data, error } = await supabase
    .from("ocr_invoice_mappings")
    .select("file_path, invoice_number, invoice_date, supplier_name, status, created_at, ocr_request_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(ocrFetchLimit);

  if (!error) setRecentOcrFiles(data || []);
};

  useEffect(() => {
    fetchTokens();
    fetchRecentOcrFiles(); // << hinzufügen
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

        const getStatusClass = (status: string) => {
  switch (status) {
    case "inventory_created":
      return "bg-green-50 hover:bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-50 hover:bg-yellow-100 text-yellow-800";
    case "success":
      return "bg-yellow-50 hover:bg-yellow-100 text-yellow-800";
    case "error":
      return "bg-red-50 hover:bg-red-100 text-red-800";
    default:
      return "bg-red-50 hover:bg-red-100 text-red-800";
  }
};


const processOcrResult = async (result: any, requestId: string, safeFileName: string) => {
  if (!user) return;
  try {
    const mappedHeader = mapOcrInvoiceMapping(result);
    const mappedItems = mapOcrInvoiceLineItems(result);

    // 1. Insert Mapping
    const { data: mappingData, error: mappingError } = await supabase
      .from("ocr_invoice_mappings")
      .insert({
        user_id: user.id,
        ocr_request_id: requestId,
        ...mappedHeader,
        file_path: `${user.id}/${safeFileName}`,
        original_file_name: fileName, // ✅ HINZUGEFÜGT
        status: "pending",
      })
      .select("id")
      .single();

    if (mappingError) throw new Error(`Failed to create invoice mapping: ${mappingError.message}`);

    // 2. Insert Items mit Referenz
    if (mappedItems?.length && mappingData?.id) {
      const itemsWithMapping = mappedItems.map((item) => ({
        ...item,
        mapping_id: mappingData.id,
      }));

      const { error: itemsError } = await supabase
        .from("ocr_invoice_items")
        .insert(itemsWithMapping);

      if (itemsError) {
        console.warn("❌ Fehler beim Speichern der line items:", itemsError.message);
        // Optional: Mapping zurückrollen?
      }
    }

    return mappingData.id;
  } catch (err: any) {
    console.error("Error processing OCR result:", err);
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
    setDuplicateInfo(null);
    const inputElement = e.target as HTMLInputElement;
    if (!inputElement.files || inputElement.files.length === 0) return;
    const selectedFile = inputElement.files[0];

// Duplikatsprüfung
const { data: duplicates } = await supabase
  .from("ocr_requests")
  .select("id, file_name, original_file_name, created_at")
  .eq("user_id", user.id)
  .eq("original_file_name", selectedFile.name)
  .order("created_at", { ascending: false });

    // Fix: Removed console.log statement that was causing the error
    
  // ✅ Hier richtig eingebettet!
  const { data: mappings, error: mappingError } = await supabase
    .from("ocr_invoice_mappings")
    .select("file_path, original_file_name, invoice_number, invoice_date, supplier_name, ocr_request_id")
    .eq("user_id", user.id)
    .eq("original_file_name", selectedFile.name)
    .in("status", ["pending", "inventory_created"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (mappingError) {
    console.warn("❌ Fehler beim Laden der Mapping-Daten:", mappingError.message);
  }

  if (Array.isArray(mappings) && mappings.length > 0 && mappings[0]?.original_file_name) {
  setDuplicateInfo(mappings[0]);
} else {
  setDuplicateInfo(null);
}

    setIsUploading(true);
    setFile(selectedFile);

    if (!user) {
      setError("You must be logged in.");
      toast({ title: t("ocr_upload.login_required"), variant: "destructive" });
      return;
    }

    if (tokens !== null && tokens < 1) {
      setError("No tokens left.");
      toast({ title: t("ocr_upload.quota_exceeded"), variant: "destructive" });
      return;
    }

    const normalizedType =
      selectedFile.type === "application/octet-stream" && selectedFile.name.endsWith(".pdf")
        ? "application/pdf"
        : selectedFile.type;

    if (!mimeTypes.includes(normalizedType)) {
      setError(t("ocr_upload.invalid_filetype"));
      return;
    }

    if (selectedFile.size / (1024 * 1024) > fileSizeLimitMB) {
      setError(t("ocr_upload.file_too_large"));
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
        original_file_name: selectedFile.name, // << NEU HINZUGEFÜGT
        status: 'pending'
      })
      .select('id')
      .single();

    if (requestError) {
      setError(t("ocr_upload.create_request_failed"));
      return;
    }

    setRequestId(requestData.id);

    // Vorschau vorbereiten (PDF → JPEG)


    // Datei hochladen (aber noch kein OCR!)
    const { error: uploadError } = await supabase.storage
      .from("ocr-files")
      .upload(securePath, selectedFile, { upsert: true });

    if (uploadError) {
      setError(t("ocr_upload.upload_failed"));
    }
  };

  const handleOcrStart = async () => {
    if (!file || !safeFileName || !requestId || !user) return;

    try {
      setIsProcessing(true);
      const formData = new FormData();
      formData.append("document", file);


      
const mindeeKey = await getApiKey("mindee");
//console.log("🔍 API-Key geladen:", mindeeKey);

if (!mindeeKey) {
  console.warn("⚠️ getApiKey hat keinen Key zurückgegeben");
  setError("Kein gültiger Mindee-API-Key gefunden.");
  toast({
    title: t("ocr_upload.api_key_missing_title"),
    description: t("ocr_upload.api_key_missing_desc"),
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
      toast({ title: t("ocr_upload.success_title"), description: t("ocr_upload.success_desc") });
      navigate(`/dashboard/ocr/review/${requestId}`);
    } catch (err: any) {
      setError(err.message);
      toast({ title: t("ocr_upload.failed_title"), description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
    {/* LEFT: Upload Panel */}
    <div className="space-y-3 max-w-sm">
      {label && <p className="text-sm font-medium mb-1.5">{label}</p>}
      {tokens !== null && (
        <div className="text-xs text-muted-foreground mb-2">
          Available OCR tokens:{" "}
          <span className={tokens < 3 ? "text-amber-500 font-medium" : ""}>{tokens}</span>
        </div>
      )}

      {/* Fix: Don't render console.log inside JSX */}
      {duplicateInfo?.original_file_name ? (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm space-y-1 mb-4">
          <div className="font-semibold text-yellow-800">Achtung: Duplikat erkannt</div>
          <div className="text-muted-foreground text-xs">Vergleiche bitte visuell mit der rechten Vorschau</div>
          {duplicateInfo.supplier_name && <div><strong>Shop:</strong> {duplicateInfo.supplier_name}</div>}
          {duplicateInfo.invoice_number && <div><strong>Rechnungsnummer:</strong> {duplicateInfo.invoice_number}</div>}
          {duplicateInfo.invoice_date && (<div><strong>Rechnungsdatum:</strong> {new Date(duplicateInfo.invoice_date).toLocaleDateString()}</div>)}
          <div><strong>Dateiname:</strong> {duplicateInfo.original_file_name ?? t("ocr_upload.unknown")}</div>
        </div>
      ) : null}

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
            Accepted formats: {mimeTypes.map((type) => type.split("/")[1]).join(", ")} (Max{" "}
            {fileSizeLimitMB}MB)
          </p>
          <p className="text-xs text-muted-foreground mt-2">
  Lade hier deine Rechnung hoch, um automatisch alle steuerrelevanten Felder per OCR zu extrahieren.
  Du kannst PDF- oder Bilddateien hochladen. Die Erkennung erfolgt durch Mindee + Nachbearbeitung.
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

      {fileName && !previewUrl && (
        <div className="flex items-center space-x-2 p-2 bg-muted rounded">
          {fileName.toLowerCase().endsWith(".pdf") ? (
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

    {/* RIGHT: Preview Panel */}
<div className="w-full flex flex-col items-center justify-start bg-muted rounded-md border p-4 max-w-[900px]">
  {previewUrl ? (
    <div
      className="relative overflow-hidden group w-full"
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
        className="transition-transform duration-300 ease-in-out w-full object-contain group-hover:scale-[1.8]"
        style={{ maxHeight: "1000px" }}
      />
      <p className="text-xs text-center text-muted-foreground mt-2">
        Vorschau – OCR wird erst nach Klick gestartet
      </p>
    </div>
  ) : (
<div className="w-full space-y-3">
    <p className="text-sm font-medium text-muted-foreground">Zuletzt hochgeladene Rechnungen:</p>
    <ul className="space-y-2 w-full">
  {recentOcrFiles.map((entry, index) => {
    const filename = entry.file_path?.split("/").pop();
    const date = entry.invoice_date
      ? new Date(entry.invoice_date).toLocaleDateString()
      : null;

    const colorClasses = getStatusClass(entry.status);

    return (
      <li
        key={index}
        onClick={() => navigate(`/dashboard/ocr/review/${entry.ocr_request_id}`)}
        className={`flex justify-between items-center p-3 rounded-md text-sm cursor-pointer transition-colors duration-150 ${colorClasses}`}
      >
        <div className="flex flex-col truncate max-w-[60%]">
          <span className="font-medium truncate">{filename}</span>
          {entry.supplier_name && (
            <span className="text-xs text-muted-foreground truncate">
              {entry.supplier_name}
            </span>
          )}
        </div>
        <div className="text-xs text-right space-y-0.5">
          {entry.invoice_number && <div>Nr: {entry.invoice_number}</div>}
          {date && <div>{date}</div>}
        </div>
      </li>
    );
  })}
</ul>

    {recentOcrFiles.length >= ocrFetchLimit && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOcrFetchLimit((prev) => prev + 5)}
        className="text-xs"
      >
        Weitere anzeigen
      </Button>
    )}
  </div>
  )}

  {previewUrl && !success && !isProcessing && (
    <Button onClick={handleOcrStart} disabled={!tokens || tokens < 1} className="mt-4">
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
