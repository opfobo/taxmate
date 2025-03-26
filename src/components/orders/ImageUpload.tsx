
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
  table: "orders" | "order_items"; // Restrict to tables we know have the right columns
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
            const { data: recordData, error: fetchError } = await supabase
              .from(table)
              .select("notes, image_url")
              .eq("id", id)
              .single();
              
            if (fetchError) {
              console.error(`Error fetching ${table} data:`, fetchError);
            } else if (recordData) {
              let updateData: Record<string, any> = {};
              
              // Always set the first image as the primary image_url
              updateData.image_url = uploadedUrls[0];
              
              // If we have existing notes, check if it's in JSON format with imageUrls
              let originalNotes = "";
              let existingImageUrls: string[] = [];
              
              if (recordData.notes && typeof recordData.notes === 'string') {
                if (recordData.notes.startsWith('{')) {
                  try {
                    const parsedNotes = JSON.parse(recordData.notes);
                    
                    // If it already has imageUrls, get them
                    if (parsedNotes && Array.isArray(parsedNotes.imageUrls)) {
                      existingImageUrls = parsedNotes.imageUrls;
                    }
                    
                    // Get original notes if available
                    originalNotes = parsedNotes.originalNotes || "";
                  } catch (e) {
                    // If the notes can't be parsed as JSON, treat as plain text
                    originalNotes = recordData.notes;
                  }
                } else {
                  // If notes are plain text
                  originalNotes = recordData.notes;
                }
              }
              
              // Combine existing and new image URLs
              updateData.notes = JSON.stringify({
                originalNotes: originalNotes,
                imageUrls: [...existingImageUrls, ...uploadedUrls]
              });
              
              // Update the record with new data
              const { error: updateError } = await supabase
                .from(table)
                .update(updateData)
                .eq("id", id);
                
              if (updateError) {
                console.error(`Error updating ${table} with images:`, updateError);
              }
            }
          } catch (error) {
            console.error(`Error processing ${table} data:`, error);
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
      
      // Update the record
      try {
        const { data: recordData, error: fetchError } = await supabase
          .from(table)
          .select("notes, image_url")
          .eq("id", id)
          .single();
          
        if (fetchError) {
          console.error(`Error fetching ${table} data:`, fetchError);
          return;
        }
        
        if (recordData) {
          let updateData: Record<string, any> = {};
          const remainingImages = images.filter(img => img !== fileUrl);
          
          // Update image_url if the deleted image was the primary one
          if (recordData.image_url === fileUrl) {
            updateData.image_url = remainingImages.length > 0 ? remainingImages[0] : null;
          }
          
          // Update notes if they contain image URLs
          let originalNotes = "";
          let updatedImageUrls: string[] = [];
          
          if (recordData.notes && typeof recordData.notes === 'string' && recordData.notes.startsWith('{')) {
            try {
              const parsedNotes = JSON.parse(recordData.notes);
              
              originalNotes = parsedNotes.originalNotes || "";
              
              if (Array.isArray(parsedNotes.imageUrls)) {
                // Filter out the deleted image
                updatedImageUrls = parsedNotes.imageUrls.filter(
                  (url: string) => url !== fileUrl
                );
              }
            } catch (e) {
              console.error("Error parsing notes:", e);
            }
          }
          
          updateData.notes = JSON.stringify({
            originalNotes: originalNotes,
            imageUrls: updatedImageUrls
          });
          
          // Only update if we have changes
          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
              .from(table)
              .update(updateData)
              .eq("id", id);
              
            if (updateError) {
              console.error(`Error updating ${table} after image deletion:`, updateError);
            }
          }
        }
        
      } catch (error) {
        console.error(`Error processing ${table} update after deletion:`, error);
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
