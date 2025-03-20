
import { useState, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ImageUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderId: string;
  type: "order" | "item";
  existingImage?: string;
}

const ImageUpload = ({
  isOpen,
  onClose,
  onSuccess,
  orderId,
  type,
  existingImage
}: ImageUploadProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check file type
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: t("invalid_file_type"),
          description: t("please_select_image_file"),
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: t("file_too_large"),
          description: t("image_must_be_less_than_5mb"),
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: t("no_file_selected"),
        description: t("please_select_file_to_upload"),
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Delete existing file if it exists
      if (existingImage) {
        await supabase.storage.from('order_images').remove([existingImage]);
      }

      // Upload new file
      const fileName = `${user?.id}/${type}_${orderId}_${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('order_images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Update the database record with the new image URL
      let updateError;
      if (type === 'order') {
        const { error } = await supabase
          .from('orders')
          .update({ image_url: fileName })
          .eq('id', orderId);
        updateError = error;
      } else {
        const { error } = await supabase
          .from('order_items')
          .update({ image_url: fileName })
          .eq('id', orderId);
        updateError = error;
      }

      if (updateError) throw updateError;

      onSuccess();
    } catch (error: any) {
      toast({
        title: t("upload_failed"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existingImage ? t("update_image") : t("upload_image")}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {existingImage && (
            <div className="border rounded-lg p-2 overflow-hidden">
              <img 
                src={`${supabase.storage.from("order_images").getPublicUrl(existingImage).data.publicUrl}`} 
                alt={t("current_image")}
                className="w-full h-auto max-h-40 object-contain"
              />
              <p className="text-xs text-muted-foreground mt-2">{t("current_image")}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="image">{t("select_image")}</Label>
            <Input
              id="image"
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
          
          {preview && (
            <div className="relative border rounded-lg p-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-muted/80"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4" />
              </Button>
              <img 
                src={preview} 
                alt={t("preview")}
                className="w-full h-auto max-h-40 object-contain"
              />
              <p className="text-xs text-muted-foreground mt-2">{t("preview")}</p>
            </div>
          )}
          
          {!file && !preview && (
            <div className="border border-dashed rounded-lg p-8 text-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {t("drag_drop_or_click_to_select")}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button 
            type="button"
            disabled={!file || isUploading}
            onClick={handleUpload}
            className="gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                {t("uploading")}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {t("upload")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUpload;
