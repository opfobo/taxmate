
import { useState, useRef, ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/context/AuthContext";

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

  // Fetch user's available tokens when component mounts or user changes
  const fetchTokens = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('ocr_tokens')
        .select('tokens')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error("Error fetching tokens:", error);
        return;
      }
      
      setTokens(data?.tokens || 0);
    } catch (err) {
      console.error("Failed to fetch tokens:", err);
    }
  };

  // Call fetchTokens when user changes
  useState(() => {
    fetchTokens();
  });

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

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
  console.log("📁 File change triggered");

  const inputElement = e.target as HTMLInputElement;
  if (!inputElement.files || inputElement.files.length === 0) {
    console.warn("⚠️ No file selected or input is empty");
    return;
  }

  const file = inputElement.files[0];
  console.log("➡️ Selected file:", file);

  resetStates();
  setPreviewUrl(null);

  if (!user) {
    setError("You must be logged in to use OCR functionality");
    toast({
      title: "Authentication required",
      description: "Please log in to upload documents for OCR processing.",
      variant: "destructive",
    });
    return;
  }

  if (tokens !== null && tokens < 1) {
    setError("You have no OCR tokens remaining");
    toast({
      title: "No tokens remaining",
      description: "You have used all your OCR tokens. Please contact support for more.",
      variant: "destructive",
    });
    return;
  }

  if (!file) {
    console.warn("⚠️ No file selected");
    return;
  }

  const normalizedType =
    file.type === "application/octet-stream" && file.name.endsWith(".pdf")
      ? "application/pdf"
      : file.type;

  if (!mimeTypes.includes(normalizedType)) {
    console.warn("❌ Unsupported MIME type:", file.type);
    setError(`Invalid file type. Allowed types: ${mimeTypes.join(", ")}`);
    toast({
      title: "Invalid file",
      description: `Only ${mimeTypes.join(", ")} files are allowed.`,
      variant: "destructive",
    });
    return;
  }

    // Validate file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > fileSizeLimitMB) {
      setError(`File too large. Maximum size: ${fileSizeLimitMB}MB`);
      toast({
        title: "File too large",
        description: `Maximum file size is ${fileSizeLimitMB}MB.`,
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);
    
    // Create a local preview for image files
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    try {
      setIsUploading(true);

      // Generate a unique filename to avoid collisions
      const fileExtension = file.name.split(".").pop();
      const timestamp = Date.now();
      const uniqueId = uuidv4().substring(0, 8);
      const safeFileName = `ocr_${timestamp}_${uniqueId}.${fileExtension}`;
      
      // Create an OCR request record with 'pending' status
      const { data: requestData, error: requestError } = await supabase
        .from('ocr_requests')
        .insert({
          user_id: user.id,
          file_name: safeFileName,
          status: 'pending'
        })
        .select('id')
        .single();
        
      if (requestError) {
        throw new Error(`Failed to create request record: ${requestError.message}`);
      }
      
      const requestId = requestData.id;
      console.log("Created OCR request with ID:", requestId);
      
      // Upload file to temporary bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("ocr-temp")
        .upload(safeFileName, file, {
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) {
        // Update the request record to error status
        await supabase
          .from('ocr_requests')
          .update({
            status: 'error',
            response: { error: uploadError.message },
            processed_at: new Date().toISOString()
          })
          .eq('id', requestId);
        
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get the public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from("ocr-temp")
        .getPublicUrl(safeFileName);

      const fileUrl = urlData.publicUrl;

      setIsUploading(false);
      setIsProcessing(true);

      // Mock OCR processing
      // In production, this would be a real API call to an OCR service
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock OCR result
        const mockResult = {
          status: "success",
          data: {
            text: "Sample extracted text from document",
            confidence: 0.92,
            fields: {
              name: "John Doe",
              address: "123 Main St, City",
              tax_id: "TAX12345",
              invoice_number: "INV-2023-001",
              total_amount: 1250.00,
              date: "2023-05-15"
            },
            raw_text: "This is a sample invoice...",
            page_count: 1
          }
        };
        
        // Decrement the user's token count
        const { error: tokenError } = await supabase.rpc('decrement_ocr_token', {
          uid: user.id
        });
        
        if (tokenError) {
          console.error("Failed to decrement token:", tokenError);
        } else {
          // Update local token count
          setTokens(prevTokens => prevTokens !== null ? prevTokens - 1 : null);
        }
        
        // Update the request record with success status and response
        await supabase
          .from('ocr_requests')
          .update({
            status: 'success',
            response: mockResult,
            processed_at: new Date().toISOString()
          })
          .eq('id', requestId);
        
        // Pass the result to the parent component
        onOcrResult(mockResult);
        
        setSuccess(true);
        toast({
          title: "OCR completed",
          description: "Document was successfully processed."
        });
      } catch (ocrError) {
        // Update the request record with error status
        await supabase
          .from('ocr_requests')
          .update({
            status: 'error',
            response: { error: String(ocrError) },
            processed_at: new Date().toISOString()
          })
          .eq('id', requestId);
          
        throw new Error(`OCR processing failed: ${ocrError}`);
      } finally {
        // Always clean up the file after processing, regardless of success or failure
        try {
          await supabase.storage.from("ocr-temp").remove([safeFileName]);
          console.log("Temporary file cleaned up:", safeFileName);
        } catch (cleanupError) {
          console.error("Failed to clean up temporary file:", cleanupError);
        }
        
        setIsProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setIsUploading(false);
      setIsProcessing(false);
      
      toast({
        title: "Upload or OCR failed",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
      
      console.error("OCR Upload error:", err);
    }
  };

  const handleReset = () => {
    resetStates();
    setPreviewUrl(null);
    setFileName(null);
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
              className={`cursor-pointer ${error ? 'border-destructive' : ''}`}
              disabled={isUploading || isProcessing || (tokens !== null && tokens < 1) || !user}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Accepted formats: {mimeTypes.map(type => type.split('/')[1]).join(', ')} (Max {fileSizeLimitMB}MB)
            </p>
          </div>
        )}
        
        {isUploading && (
          <div className="w-full space-y-2">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm">Uploading: {uploadProgress}%</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
        
        {isProcessing && (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm">Processing document...</span>
          </div>
        )}
        
        {previewUrl && !isUploading && !isProcessing && !success && (
          <div className="border rounded-md p-2 max-w-xs mx-auto mt-2">
            <div className="aspect-video relative bg-muted flex items-center justify-center rounded">
              <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded" />
            </div>
            <p className="text-xs text-center mt-1 truncate max-w-full">{fileName}</p>
          </div>
        )}
        
        {fileName && !previewUrl && !isUploading && !isProcessing && !success && (
          <div className="flex items-center space-x-2 p-2 bg-muted rounded">
            {fileName.toLowerCase().endsWith('.pdf') ? (
              <FileText className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="text-sm truncate max-w-[200px]">{fileName}</span>
          </div>
        )}
        
        {error && !isUploading && !isProcessing && (
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
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
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
