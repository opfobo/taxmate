
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { ImagePlus, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import ImageUpload from "./ImageUpload";
import { toast } from "@/hooks/use-toast";

interface ItemDetailsDialogProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated: () => void;
}

const ItemDetailsDialog = ({
  item,
  isOpen,
  onClose,
  onItemUpdated,
}: ItemDetailsDialogProps) => {
  const { t } = useTranslation();
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);

  const handleUploadSuccess = () => {
    toast({
      title: t("image_uploaded"),
      description: t("image_uploaded_successfully"),
    });
    setIsImageUploadOpen(false);
    onItemUpdated();
  };

  const handleDeleteImage = async () => {
    if (!item.image_url) return;

    try {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from("order_images")
        .remove([item.image_url]);

      if (storageError) throw storageError;

      // Update the item record
      const { error: dbError } = await supabase
        .from("order_items")
        .update({ image_url: null })
        .eq("id", item.id);

      if (dbError) throw dbError;

      toast({
        title: t("image_deleted"),
        description: t("image_deleted_successfully"),
      });
      onItemUpdated();
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("item_details")}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t("product_name")}
                </h3>
                <p>{item.product_name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t("quantity")}
                </h3>
                <p>{item.quantity}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t("unit_price")}
                </h3>
                <p>
                  {new Intl.NumberFormat("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  }).format(item.unit_price)}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t("total_price")}
                </h3>
                <p>
                  {new Intl.NumberFormat("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  }).format(item.total_price)}
                </p>
              </div>
              
              {item.supplier && (
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t("supplier")}
                  </h3>
                  <p>{item.supplier.name}</p>
                </div>
              )}
            </div>
            
            {item.image_url && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {t("image")}
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <img 
                    src={`${supabase.storage.from("order_images").getPublicUrl(item.image_url).data.publicUrl}`} 
                    alt={item.product_name} 
                    className="w-full h-auto max-h-[300px] object-contain"
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setIsImageUploadOpen(true)}
              >
                <ImagePlus className="h-4 w-4" />
                {item.image_url ? t("update_image") : t("add_image")}
              </Button>
              
              {item.image_url && (
                <Button 
                  variant="outline" 
                  className="gap-2 border-red-500 hover:bg-red-50"
                  onClick={handleDeleteImage}
                >
                  <Trash className="h-4 w-4 text-red-500" />
                  {t("delete_image")}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ImageUpload
        isOpen={isImageUploadOpen}
        onClose={() => setIsImageUploadOpen(false)}
        onSuccess={handleUploadSuccess}
        orderId={item.id}
        type="item"
        existingImage={item.image_url}
      />
    </>
  );
};

export default ItemDetailsDialog;
