
import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/context/AuthContext";

const MINDEE_API_KEY = "4173d96a82bd5fc4423bfc3c0bda37ed";
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Process OCR data and create invoice mapping
  const processOcrResult = async (result: any, requestId: string) => {
    if (!user) return;
    
    try {
      // Extract invoice fields from Mindee result
      const prediction = result.document.inference.prediction;
      
      // Extract basic invoice information
      const invoiceNumber = prediction.invoice_number?.value || null;
      const invoiceDate = prediction.date?.value || null;
      const totalAmount = prediction.total_amount?.value || null;
      const totalNet = prediction.total_net?.value || null;
      const totalTax = prediction.total_tax?.value || null;
      
      // Extract supplier information
      const supplierName = prediction.supplier_name?.value || null;
      const supplierAddress = prediction.supplier_address?.value || null;
      
      // Extract customer information
      const customerName = prediction.customer_name?.value || null;
      const customerAddress = prediction.customer_address?.value || null;
      
      // Extract line items
      const lineItems = prediction.line_items?.map((item: any, index: number) => ({
        id: uuidv4(),
        description: item.description || `Item ${index + 1}`,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total_amount: item.total_amount || 0
      })) || [];

      // Create invoice mapping
      const { data: mappingData, error: mappingError } = await supabase
        .from('ocr_invoice_mappings')
        .insert({
          user_id: user.id,
          ocr_request_id: requestId,
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate,
          supplier_name: supplierName,
          supplier_address: supplierAddress,
          supplier_vat: null, // Not provided by Mindee directly
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

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const inputElement = e.target as HTMLInputElement;
    if (!inputElement.files || inputElement.files.length === 0) return;
    const file = inputElement.files[0];

    resetStates();
    setPreviewUrl(null);

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
      file.type === "application/octet-stream" && file.name.endsWith(".pdf")
        ? "application/pdf"
        : file.type;

    if (!mimeTypes.includes(normalizedType)) {
      setError("Invalid file type");
      return;
    }

    if (file.size / (1024 * 1024) > fileSizeLimitMB) {
      setError("File too large");
      return;
    }

    setFileName(file.name);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    try {
      setIsUploading(true);
      const fileExtension = file.name.split(".").pop();
      const timestamp = Date.now();
      const uniqueId = uuidv4().substring(0, 8);
      const safeFileName = `ocr_${timestamp}_${uniqueId}.${fileExtension}`;

      const { data: requestData, error: requestError } = await supabase
        .from('ocr_requests')
        .insert({
          user_id: user.id,
          file_name: safeFileName,
          status: 'pending'
        })
        .select('id')
        .single();

      if (requestError) throw new Error(`DB insert failed: ${requestError.message}`);
      const requestId = requestData.id;

// 1. Upload in ocr-temp für Mindee
const { error: tempError } = await supabase.storage
  .from("ocr-temp")
  .upload(safeFileName, file, {
    cacheControl: "3600",
    upsert: false
  });

if (tempError) {
  await supabase.from("ocr_requests").update({
    status: "error",
    response: { error: tempError.message },
    processed_at: new Date().toISOString()
  }).eq("id", requestId);
  throw new Error(`Upload to ocr-temp failed: ${tempError.message}`);
}

// 2. Upload in ocr-files für Vorschau & Archivierung
const securePath = `${user.id}/${safeFileName}`;
const { error: filesError } = await supabase.storage
  .from("ocr-files")
  .upload(securePath, file, {
    cacheControl: "3600",
    upsert: false
  });

if (filesError) {
  throw new Error(`Upload to ocr-files failed: ${filesError.message}`);
}

// ✅ URL für Mindee aus dem temp-Bucket abrufen
const { data: tempUrlData } = supabase.storage.from("ocr-temp").getPublicUrl(safeFileName);
const fileUrl = tempUrlData.publicUrl;


if (copyError) {
  console.error("❗ Fehler beim Kopieren der Datei:", copyError);
  throw new Error(`Fehler beim Kopieren der Datei: ${copyError.message}`);
}

// URL im sicheren Bucket abrufen
const { data: secureUrlData } = supabase.storage
  .from(secureBucket)
  .getPublicUrl(securePath);
const fileUrl = secureUrlData.publicUrl;

      setIsUploading(false);
      setIsProcessing(true);

const mindeeResponse = await fetch(MINDEE_API_URL, {
  method: "POST",
  headers: {
    "Authorization": `Token ${MINDEE_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ document: fileUrl }) // ✅ jetzt aus sicherem Bucket
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

      // Process OCR result and create invoice mapping
      const mappingId = await processOcrResult(result, requestId);
      
      onOcrResult(result);
      setSuccess(true);
      toast({ 
        title: "OCR completed", 
        description: "Document processed successfully. You can now review the extracted data." 
      });
      
      // Navigate to invoice review page
      navigate(`/ocr/review/${requestId}`);

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
            <span className="text-sm">Processing with Mindee...</span>
          </div>
        )}

        {previewUrl && (
          <div className="border rounded-md p-2 max-w-xs mx-auto mt-2">
            <div className="aspect-video relative bg-muted flex items-center justify-center rounded">
              <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded" />
            </div>
            <p className="text-xs text-center mt-1 truncate">{fileName}</p>
          </div>
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
