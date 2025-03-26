
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { v4 as uuidv4 } from "uuid";
import { Loader2, Trash } from "lucide-react";

export interface ImageUploadProps {
  id: string;
  table: string;
  storagePath: string;
  field: string;
}

const ImageUpload = ({ id, table, storagePath, field }: ImageUploadProps) => {
  const { t } = useTranslation();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const bucket = "order-images";

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .list(`${id}`, { limit: 100, sortBy: { column: "created_at", order: "asc" } });

      if (error) {
        console.error("Error fetching images:", error);
        return;
      }
      
      if (data && data.length > 0) {
        const urls = data.map(file => getPublicUrl(file.name));
        setImages(urls);
      } else {
        setImages([]);
      }
    } catch (error) {
      console.error("Error in fetchImages:", error);
    }
  };

  const getPublicUrl = (fileName: string) => {
    const { data } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(`${id}/${fileName}`);
    return data.publicUrl;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadedUrls = [];

      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${id}/${fileName}`;

        const { error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (error) {
          console.error("Upload error:", error);
          toast({
            title: t("upload_failed"),
            description: error.message,
            variant: "destructive",
          });
        } else {
          const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
          
          uploadedUrls.push(data.publicUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        toast({
          title: t("upload_successful"),
          description: t("images_uploaded"),
        });

        // Update the record with the first image URL if the field is specified
        if (field && id && table) {
          try {
            // Check if there's existing JSON data in notes
            const { data: orderData, error: fetchError } = await supabase
              .from(table)
              .select("notes, image_url")
              .eq("id", id)
              .single();
              
            if (fetchError) {
              console.error("Error fetching order data:", fetchError);
            } else {
              let updateData: Record<string, any> = {};
              
              // Always set the first image as the primary image_url
              updateData.image_url = uploadedUrls[0];
              
              // If we have existing notes, check if it's in JSON format with imageUrls
              if (orderData?.notes && orderData.notes.startsWith('{')) {
                try {
                  const parsedNotes = JSON.parse(orderData.notes);
                  
                  // If it already has imageUrls, append the new ones
                  if (Array.isArray(parsedNotes.imageUrls)) {
                    updateData.notes = JSON.stringify({
                      originalNotes: parsedNotes.originalNotes || "",
                      imageUrls: [...parsedNotes.imageUrls, ...uploadedUrls]
                    });
                  } else {
                    // If it has JSON but no imageUrls
                    updateData.notes = JSON.stringify({
                      ...parsedNotes,
                      imageUrls: uploadedUrls
                    });
                  }
                } catch (e) {
                  // If the notes can't be parsed as JSON, create new JSON
                  updateData.notes = JSON.stringify({
                    originalNotes: orderData.notes || "",
                    imageUrls: uploadedUrls
                  });
                }
              } else {
                // If no existing notes or notes are plain text
                updateData.notes = JSON.stringify({
                  originalNotes: orderData?.notes || "",
                  imageUrls: uploadedUrls
                });
              }
              
              // Update the record with new data
              const { error: updateError } = await supabase
                .from(table)
                .update(updateData)
                .eq("id", id);
                
              if (updateError) {
                console.error("Error updating record with images:", updateError);
              }
            }
          } catch (error) {
            console.error("Error processing order data:", error);
          }
        }
      }
    } catch (error) {
      console.error("Upload processing error:", error);
      toast({
        title: t("upload_error"),
        description: t("error_processing_upload"),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      fetchImages();
    }
  };

  const handleDelete = async (fileUrl: string) => {
    try {
      const fileName = fileUrl.split("/").pop();
      if (!fileName) return;
      
      const filePath = `${id}/${fileName}`;

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
        return;
      }
      
      // Update the images list
      setImages(images.filter(img => img !== fileUrl));
      
      // Update the order record
      try {
        const { data: orderData, error: fetchError } = await supabase
          .from(table)
          .select("notes, image_url")
          .eq("id", id)
          .single();
          
        if (fetchError) {
          console.error("Error fetching order data:", fetchError);
          return;
        }
        
        let updateData: Record<string, any> = {};
        const remainingImages = images.filter(img => img !== fileUrl);
        
        // Update image_url if the deleted image was the primary one
        if (orderData?.image_url === fileUrl) {
          updateData.image_url = remainingImages.length > 0 ? remainingImages[0] : null;
        }
        
        // Update notes if they contain image URLs
        if (orderData?.notes && orderData.notes.startsWith('{')) {
          try {
            const parsedNotes = JSON.parse(orderData.notes);
            
            if (Array.isArray(parsedNotes.imageUrls)) {
              // Filter out the deleted image
              const updatedImageUrls = parsedNotes.imageUrls.filter(
                (url: string) => url !== fileUrl
              );
              
              updateData.notes = JSON.stringify({
                originalNotes: parsedNotes.originalNotes || "",
                imageUrls: updatedImageUrls
              });
            }
          } catch (e) {
            console.error("Error parsing notes:", e);
          }
        }
        
        // Only update if we have changes
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from(table)
            .update(updateData)
            .eq("id", id);
            
          if (updateError) {
            console.error("Error updating record after image deletion:", updateError);
          }
        }
        
      } catch (error) {
        console.error("Error processing order update after deletion:", error);
      }
      
      toast({
        title: t("image_deleted"),
        description: t("image_deleted_successfully"),
      });
    } catch (error) {
      console.error("Delete processing error:", error);
      toast({
        title: t("delete_error"),
        description: t("error_processing_delete"),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (id) {
      fetchImages();
    }
  }, [id]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Input 
          type="file" 
          multiple 
          onChange={handleUpload} 
          disabled={uploading} 
          accept="image/*"
          className="cursor-pointer"
        />
        {uploading && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t("uploading_images")}
          </div>
        )}
      </div>
      
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {images.map((url) => (
            <div key={url} className="relative group border rounded overflow-hidden">
              <img src={url} alt="Order Image" className="w-full h-auto object-cover aspect-square" />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 opacity-75 hover:opacity-100"
                onClick={() => handleDelete(url)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
