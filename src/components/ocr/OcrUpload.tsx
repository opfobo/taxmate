
import { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadCloud, AlertTriangle, FileText, RefreshCw, Upload, ChevronRight } from "lucide-react";
import DocumentPreview from "./DocumentPreview";

export type OcrUploadProps = {
  onComplete?: (result: any) => void;
  mode?: "invoice" | "consumer";
};

const OcrUpload = ({ onComplete, mode = "invoice" }: OcrUploadProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const abortController = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const { data: recentFiles = [] } = useQuery({
    queryKey: ["recent-files", mode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ocr_requests")
        .select("*")
        .eq("type", mode)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", mode);

      abortController.current = new AbortController();

      const response = await fetch("/api/ocr/upload", {
        method: "POST",
        body: formData,
        signal: abortController.current.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('ocr_upload.generic_error'));
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.duplicate) {
        toast({
          title: t('ocr_upload.duplicate_detected'),
          description: t('ocr_upload.duplicate_warning'),
          variant: "warning",
        });
      } else {
        toast({
          title: t('ocr_upload.upload_success'),
          description: t('ocr_upload.processing_started'),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["recent-files"] });
      if (onComplete) onComplete(data);
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: t('ocr_upload.upload_failed'),
        description: error instanceof Error ? error.message : t('ocr_upload.try_again'),
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFile = acceptedFiles[0];
      if (newFile) {
        setFile(newFile);
        const objectUrl = URL.createObjectURL(newFile);
        setPreview(objectUrl);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleStartOcr = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      await uploadMutation.mutateAsync(file);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Card>
          <CardHeader>
            <CardTitle>{t('ocr_upload.upload_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-primary bg-primary/5" : "border-muted"
                }`}
              >
                <input {...getInputProps()} />
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  {isDragActive
                    ? t('ocr_upload.drop_here')
                    : t('ocr_upload.drag_or_click')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('ocr_upload.accepted_formats')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <FileText className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleStartOcr}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        {t('ocr_upload.processing')}
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {t('ocr_upload.start_ocr')}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isProcessing}
                  >
                    {t('ocr_upload.reset')}
                  </Button>
                </div>

                {isProcessing && (
                  <p className="text-xs text-muted-foreground">
                    {t('ocr_upload.processing_hint')}
                  </p>
                )}
              </div>
            )}
          </CardContent>
          {recentFiles.length > 0 && (
            <>
              <CardHeader>
                <CardTitle>{t('ocr_upload.recent_files')}</CardTitle>
              </CardHeader>
              <ScrollArea className="h-[200px]">
                <CardContent>
                  <div className="space-y-2">
                    {recentFiles.map((file: any) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 text-sm hover:bg-muted rounded-md"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate flex-1">
                            {file.filename || t('ocr_upload.unnamed_file')}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onComplete?.(file)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </ScrollArea>
            </>
          )}
          <CardFooter className="text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t('ocr_upload.privacy_notice')}
          </CardFooter>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>{t('ocr_upload.preview_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentPreview url={preview} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OcrUpload;
