
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { X, ImagePlus, Save, Edit, Trash } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ImageUpload from "./ImageUpload";

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
  onItemUpdated
}: ItemDetailsDialogProps) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [productName, setProductName] = useState(item.product_name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [unitPrice, setUnitPrice] = useState(item.unit_price);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async () => {
      const totalPrice = Number(quantity) * Number(unitPrice);
      
      const { data, error } = await supabase
        .from("order_items")
        .update({
          product_name: productName,
          quantity: Number(quantity),
          unit_price: Number(unitPrice),
          total_price: totalPrice,
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: t("item_updated"),
        description: t("item_updated_successfully"),
      });
      setIsEditing(false);
      onItemUpdated();
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("order_items")
        .delete()
        .eq("id", item.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({
        title: t("item_deleted"),
        description: t("item_deleted_successfully"),
      });
      onClose();
      onItemUpdated();
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageUploadSuccess = () => {
    setIsImageUploadOpen(false);
    onItemUpdated();
  };

  const handleConfirmDelete = () => {
    if (window.confirm(t("confirm_delete_item"))) {
      deleteItemMutation.mutate();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("item_details")}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {item.image_url && (
              <div className="border rounded-lg overflow-hidden">
                <img 
                  src={`${supabase.storage.from("order_images").getPublicUrl(item.image_url).data.publicUrl}`} 
                  alt={item.product_name} 
                  className="w-full h-auto max-h-60 object-contain"
                />
              </div>
            )}
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="productName">{t("product_name")}</Label>
                {isEditing ? (
                  <Input
                    id="productName"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{item.product_name}</div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">{t("quantity")}</Label>
                  {isEditing ? (
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  ) : (
                    <div className="p-2 border rounded-md">{item.quantity}</div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">{t("unit_price")}</Label>
                  {isEditing ? (
                    <Input
                      id="unitPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                    />
                  ) : (
                    <div className="p-2 border rounded-md">
                      {new Intl.NumberFormat("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      }).format(item.unit_price)}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{t("total_price")}</Label>
                <div className="p-2 border rounded-md font-medium">
                  {new Intl.NumberFormat("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  }).format(isEditing ? Number(quantity) * Number(unitPrice) : item.total_price)}
                </div>
              </div>
              
              {item.supplier && (
                <div className="space-y-2">
                  <Label>{t("supplier")}</Label>
                  <div className="p-2 border rounded-md">{item.supplier.name}</div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              {!isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    {t("edit")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 text-red-500 border-red-200 hover:bg-red-50"
                    onClick={handleConfirmDelete}
                  >
                    <Trash className="h-4 w-4" />
                    {t("delete")}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  {t("cancel")}
                </Button>
              )}
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              {isEditing ? (
                <Button
                  type="button"
                  onClick={() => updateItemMutation.mutate()}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {t("save")}
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsImageUploadOpen(true)}
                    className="gap-2"
                  >
                    <ImagePlus className="h-4 w-4" />
                    {item.image_url ? t("update_image") : t("add_image")}
                  </Button>
                  <Button type="button" onClick={onClose}>
                    {t("close")}
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ImageUpload
        isOpen={isImageUploadOpen}
        onClose={() => setIsImageUploadOpen(false)}
        onSuccess={handleImageUploadSuccess}
        orderId={item.id}
        type="item"
        existingImage={item.image_url}
      />
    </>
  );
};

export default ItemDetailsDialog;
