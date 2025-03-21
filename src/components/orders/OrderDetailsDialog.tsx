import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

interface OrderDetailsDialogProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: () => void;
}

const OrderDetailsDialog = ({
  order,
  isOpen,
  onClose,
  onOrderUpdated,
}: OrderDetailsDialogProps) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (order?.image_urls) {
      setImageUrls(order.image_urls);
    }
  }, [order]);

  const handleUploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !order?.id) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const filePath = `orders/${order.id}/${uuidv4()}.${fileExt}`;

        const { error } = await supabase.storage
          .from("order_images")
          .upload(filePath, file);

        if (error) {
          throw error;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("order_images").getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      // Save new image URLs to the order
      const newImageList = [...(imageUrls || []), ...uploadedUrls];
      const { error: updateError } = await supabase
        .from("orders")
        .update({ image_urls: newImageList })
        .eq("id", order.id);

      if (updateError) {
        throw updateError;
      }

      setImageUrls(newImageList);
      toast({
        title: t("upload_success"),
        description: t("images_uploaded_successfully"),
      });
      onOrderUpdated();
    } catch (error: any) {
      console.error("Upload error:", error.message);
      toast({
        title: t("upload_failed"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("order_details")}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4 space-y-4">
          <div>
            <strong>{t("order_number")}:</strong> {order.order_number}
          </div>
          <div>
            <strong>{t("order_date")}:</strong>{" "}
            {order.order_date && format(new Date(order.order_date), "PPP")}
          </div>
          <div>
            <strong>{t("status")}:</strong> {order.status}
          </div>
          <div>
            <strong>{t("total_price")}:</strong> {order.total_price} {order.currency}
          </div>
          {order.supplier && (
            <div>
              <strong>{t("supplier")}:</strong> {order.supplier.name}
            </div>
          )}
          {order.notes && (
            <div>
              <strong>{t("notes")}:</strong> {order.notes}
            </div>
          )}

          {/* Bilder Galerie */}
          <div className="space-y-2">
            <strong>{t("images")}:</strong>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {imageUrls.length > 0 ? (
                imageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`order-img-${index}`}
                    className="rounded-md w-full h-auto object-cover border"
                  />
                ))
              ) : (
                <p className="text-muted-foreground">{t("no_images")}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUploadImages}
              className="hidden"
              id="imageUploadInput"
            />
            <label htmlFor="imageUploadInput">
              <Button
                disabled={uploading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ImagePlus className="w-4 h-4" />
                {uploading ? t("uploading") : t("add_picture")}
              </Button>
            </label>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
