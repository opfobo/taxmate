
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderId: string;
  type: "order" | "item";
  existingImage?: string | null;
}

const ImageUpload = ({
  isOpen,
  onClose,
  onSuccess,
  orderId,
  type,
  existingImage,
}: ImageUploadProps) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file type
    if (!selectedFile.type.includes("image/")) {
      setError(t("file_type_error"));
      return;
    }

    // Check file size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError(t("file_size_error"));
      return;
    }

    setError(null);
    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      // Generate a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${type}_${orderId}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${type === "order" ? "orders" : "items"}/${fileName}`;

      // Upload the file to storage
      const { error: uploadError } = await supabase.storage
        .from("order_images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Update the order or item record
      const tableName = type === "order" ? "orders" : "order_items";
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ image_url: filePath })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // If there was an existing image, delete it
      if (existingImage) {
        await supabase.storage
          .from("order_images")
          .remove([existingImage]);
      }

      onSuccess();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {existingImage ? t("update_image") : t("upload_image")}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image" className="block">
              {t("select_image")}
            </Label>
            
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
            
            {error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
          </div>
          
          {(preview || existingImage) && (
            <div className="mt-4 border rounded-lg overflow-hidden">
              <img 
                src={preview || `${supabase.storage.from("order_images").getPublicUrl(existingImage!).data.publicUrl}`} 
                alt={t("preview")} 
                className="w-full h-auto max-h-[300px] object-contain"
              />
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button 
              type="submit" 
              disabled={!file || isUploading}
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
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUpload;
