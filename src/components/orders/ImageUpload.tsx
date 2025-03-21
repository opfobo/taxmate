import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { v4 as uuidv4 } from "uuid";

interface ImageUploadProps {
  orderId: string;
}

const ImageUpload = ({ orderId }: ImageUploadProps) => {
  const { t } = useTranslation();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const bucket = "order_images";

  const fetchImages = async () => {
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .list(`${orderId}`, { limit: 100, sortBy: { column: "created_at", order: "asc" } });

    if (error) {
      console.error("Error fetching images:", error);
    } else {
      const urls = data.map(file => getPublicUrl(file.name));
      setImages(urls);
    }
  };

  const getPublicUrl = (fileName: string) => {
    const { data } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(`${orderId}/${fileName}`);
    return data.publicUrl;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(`${orderId}/${fileName}`, file);

      if (error) {
        console.error("Upload error:", error);
        toast({
          title: t("upload_failed"),
          description: error.message,
          variant: "destructive",
        });
      }
    }

    setUploading(false);
    toast({
      title: t("upload_successful"),
      description: t("images_uploaded"),
    });

    fetchImages();
  };

  const handleDelete = async (fileUrl: string) => {
    const fileName = fileUrl.split("/").pop();
    const filePath = `${orderId}/${fileName}`;

    const { error } = await supabase
      .storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      toast({
        title: t("delete_failed"),
        description: error.message,
        variant: "destructive",
      });
    } else {
      setImages(images.filter(img => img !== fileUrl));
      toast({
        title: t("image_deleted"),
        description: t("image_deleted_successfully"),
      });
    }
  };

  useEffect(() => {
    fetchImages();
  }, [orderId]);

  return (
    <div className="space-y-4">
      <label className="block font-medium">{t("upload_image")}</label>
      <Input type="file" multiple onChange={handleUpload} disabled={uploading} />
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {images.map((url) => (
            <div key={url} className="relative group border rounded overflow-hidden">
              <img src={url} alt="Order Image" className="w-full h-auto" />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 opacity-75 hover:opacity-100"
                onClick={() => handleDelete(url)}
              >
                {t("delete")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
