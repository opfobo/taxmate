import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { v4 as uuidv4 } from "uuid";
import { OcrUploadProps } from "./types";
import {
  fetchUserTokens,
  preparePreviewImage,
  uploadOriginalFile,
  createOcrRequest,
  sendFileToMindee,
  processOcrResult,
  generateFileNames
} from "@/utils/ocr/ocrHelpers";

export const OcrUpload = ({
  onOcrResult,
  label = "Upload document for OCR",
  mimeTypes = ["application/pdf", "image/jpeg", "image/png"],
  fileSizeLimitMB = 10,
}: OcrUploadProps) => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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

  useEffect(() => {
    fetchUserTokens(user).then(setTokens);
  }, [user]);

  const resetStates = () => {
    setIsUploading(false);
    setIsProcessing(false);
    setError(null);
    setSuccess(false);
    setFile(null);
    setFileName(null);
    setSafeFileName(null);
    setRequestId(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const inputFile = e.target?.files?.[0];
    if (!inputFile || !user) return;

    resetStates();
    setFile(inputFile);
    setFileName(inputFile.name);

    if (tokens !== null && tokens < 1) {
      setError("No tokens left");
      toast({ title: "OCR quota exceeded", variant: "destructive" });
      return;
    }

    const { safeName, securePath } = generateFileNames(inputFile.name, user.id);
    setSafeFileName(safeName);

    const request = await createOcrRequest(user.id, safeName);
    if (!request?.id) {
      setError("Failed to create OCR request");
      return;
    }
    setRequestId(request.id);

    const preview = await preparePreviewImage(inputFile, safeName, user.id);
    if (preview?.url) setPreviewUrl(preview.url);

    const uploadError = await uploadOriginalFile(inputFile, securePath);
    if (uploadError) setError("File upload failed");
  };

  const handleOcrStart = async () => {
    if (!file || !safeFileName || !requestId || !user) return;
    setIsProcessing(true);

    try {
      const result = await sendFileToMindee(file);
      await processOcrResult(result, requestId, safeFileName, user.id);
      setTokens(prev => prev !== null ? prev - 1 : null);
      toast({ title: "OCR completed", description: "Document processed successfully." });
      onOcrResult(result);
      setSuccess(true);
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
              disabled={!user || isUploading || isProcessing || tokens === 0}
              className={`cursor-pointer ${error ? "border-destructive" : ""}`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Accepted formats: {mimeTypes.map(t => t.split("/")[1]).join(", ")} (Max {fileSizeLimitMB}MB)
            </p>
          </div>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm">Processing with Mindee...</span>
          </div>
        )}

        {previewUrl && (
          <div className="relative overflow-hidden rounded group w-full max-w-sm aspect-video" onMouseMove={(e) => {
            const img = e.currentTarget.querySelector("img") as HTMLImageElement;
            if (!img) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            img.style.transformOrigin = `${x}% ${y}%`;
          }}>
            <img
      src={previewUrl}
      alt="Preview"
      className="transition-transform duration-300 ease-in-out w-full object-contain group-hover:scale-[2.0]"
      style={{ maxHeight: "800px" }}
    />
    <p className="text-xs text-center text-muted-foreground mt-2">
      Vorschau – OCR wird erst nach Klick gestartet
    </p>
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
