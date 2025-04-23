import React, { useState, useRef, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Fix for ReactNode issue
const fixReactNodeIssue = (fn: () => void): React.ReactNode => {
  fn();
  return null;
};

interface OcrUploadProps {
  type: "invoice" | "consumer";
}

export const OcrUpload = ({ type }: OcrUploadProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ocrRequestId, setOcrRequestId] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    setSuccess(false);
    setOcrRequestId(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const droppedFile = event.dataTransfer.files?.[0] || null;
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      setSuccess(false);
      setOcrRequestId(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError(t("ocr.error_file_type"));
      return false;
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setError(t("ocr.error_file_size"));
      return false;
    }
    
    return true;
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!file || !user) return null;
    
    // Generate a unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    
    try {
      // Upload file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('ocr_uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(Math.round(percent));
          },
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('ocr_uploads')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const createOcrRequest = async (fileUrl: string): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    
    // Create a record in the ocr_requests table
    const { data, error } = await supabase
      .from('ocr_requests')
      .insert([
        { 
          user_id: user.id,
          file_url: fileUrl,
          file_name: file?.name,
          status: 'pending',
          type: type,
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    
    return data.id;
  };

  const processOcr = async (requestId: string): Promise<void> => {
    try {
      // Call the Edge Function to process the OCR
      const { data, error } = await supabase.functions.invoke('process-ocr', {
        body: { requestId },
      });
      
      if (error) throw error;
      
      // Update the OCR request with the response
      const { error: updateError } = await supabase
        .from('ocr_requests')
        .update({ 
          status: 'completed',
          response: data,
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);
      
      if (updateError) throw updateError;
      
      // Decrement the user's OCR token count
      const { error: tokenError } = await supabase.rpc('decrement_ocr_token', {
        user_id: user?.id
      });
      
      if (tokenError) {
        console.error('Error decrementing OCR token:', tokenError);
        // Continue anyway, as the OCR was successful
      }
      
    } catch (error) {
      console.error('Error processing OCR:', error);
      
      // Update the OCR request with the error
      await supabase
        .from('ocr_requests')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : String(error)
        })
        .eq('id', requestId);
      
      throw error;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!file || !user) {
      setError(t("ocr.error_no_file"));
      return;
    }
    
    if (!validateFile(file)) {
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);
      
      // Step 1: Upload the file
      const fileUrl = await uploadFile();
      if (!fileUrl) {
        throw new Error(t("ocr.error_upload_failed"));
      }
      
      // Step 2: Create OCR request
      const requestId = await createOcrRequest(fileUrl);
      setOcrRequestId(requestId);
      
      // Step 3: Process OCR
      setUploading(false);
      setProcessing(true);
      await processOcr(requestId);
      
      // Success!
      setProcessing(false);
      setSuccess(true);
      toast({
        title: t("ocr.success_title"),
        description: t("ocr.success_description"),
      });
      
    } catch (error) {
      console.error('OCR process error:', error);
      setError(error instanceof Error ? error.message : t("ocr.error_unknown"));
      setUploading(false);
      setProcessing(false);
      
      toast({
        title: t("ocr.error_title"),
        description: error instanceof Error ? error.message : t("ocr.error_unknown"),
        variant: "destructive",
      });
    }
  };

  const handleViewResults = () => {
    if (ocrRequestId) {
      navigate(`/dashboard/ocr/review/${ocrRequestId}`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
    setOcrRequestId(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <h2 className="text-2xl font-bold tracking-tight">
          {type === "invoice" ? t("ocr.invoice_title") : t("ocr.consumer_title")}
        </h2>
        <p className="text-muted-foreground">
          {type === "invoice" ? t("ocr.invoice_description") : t("ocr.consumer_description")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            file ? 'bg-muted border-primary/50' : 'hover:bg-muted/50'
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center justify-center space-y-2">
            {file ? (
              <>
                <FileText className="h-10 w-10 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t("ocr.drop_files")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("ocr.file_requirements")}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("ocr.error_title")}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("ocr.uploading")}</Label>
              <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {processing && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>{t("ocr.processing_title")}</AlertTitle>
            <AlertDescription>{t("ocr.processing_description")}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>{t("ocr.success_title")}</AlertTitle>
            <AlertDescription>{t("ocr.success_description")}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {!success ? (
            <Button 
              type="submit" 
              disabled={!file || uploading || processing}
              className="w-full sm:w-auto"
            >
              {uploading || processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? t("ocr.uploading") : t("ocr.processing")}
                </>
              ) : (
                t("ocr.submit")
              )}
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handleViewResults}
              className="w-full sm:w-auto"
            >
              {t("ocr.view_results")}
            </Button>
          )}
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleReset}
            disabled={uploading || processing}
            className="w-full sm:w-auto"
          >
            {success ? t("ocr.process_another") : t("ocr.reset")}
          </Button>
        </div>
      </form>

      {type === "invoice" && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <Tabs defaultValue="info">
              <TabsList className="mb-4">
                <TabsTrigger value="info">{t("ocr.info_tab")}</TabsTrigger>
                <TabsTrigger value="tips">{t("ocr.tips_tab")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <h3 className="text-lg font-medium">{t("ocr.how_it_works")}</h3>
                <div className="grid gap-4">
                  <div className="flex gap-2">
                    <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center shrink-0">1</div>
                    <div>
                      <p className="font-medium">{t("ocr.step1_title")}</p>
                      <p className="text-sm text-muted-foreground">{t("ocr.step1_description")}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center shrink-0">2</div>
                    <div>
                      <p className="font-medium">{t("ocr.step2_title")}</p>
                      <p className="text-sm text-muted-foreground">{t("ocr.step2_description")}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center shrink-0">3</div>
                    <div>
                      <p className="font-medium">{t("ocr.step3_title")}</p>
                      <p className="text-sm text-muted-foreground">{t("ocr.step3_description")}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tips" className="space-y-4">
                <h3 className="text-lg font-medium">{t("ocr.tips_title")}</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>{t("ocr.tip1")}</li>
                  <li>{t("ocr.tip2")}</li>
                  <li>{t("ocr.tip3")}</li>
                  <li>{t("ocr.tip4")}</li>
                </ul>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OcrUpload;
