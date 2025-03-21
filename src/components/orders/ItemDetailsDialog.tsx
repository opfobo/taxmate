
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ImageUpload from "@/components/orders/ImageUpload";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ItemDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  orderId: string;
  onItemUpdated: () => void;
}

const ItemDetailsDialog = ({ isOpen, onClose, item, orderId, onItemUpdated }: ItemDetailsDialogProps) => {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [updatedItem, setUpdatedItem] = useState({ ...item });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  useEffect(() => {
    // Reset the updated item when the dialog opens or item changes
    setUpdatedItem({ ...item });
    
    // Fetch suppliers for the dropdown
    fetchSuppliers();
  }, [item, isOpen]);

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    const { data, error } = await supabase
      .from("suppliers")
      .select("id, name");
    
    setLoadingSuppliers(false);
    if (error) {
      console.error("Error fetching suppliers:", error);
      return;
    }
    
    setSuppliers(data || []);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Calculate the total price
    const totalPrice = updatedItem.quantity * updatedItem.unit_price;
    
    const { error } = await supabase
      .from("order_items")
      .update({
        product_name: updatedItem.product_name,
        quantity: updatedItem.quantity,
        unit_price: updatedItem.unit_price,
        total_price: totalPrice,
        supplier_id: updatedItem.supplier_id
      })
      .eq("id", item.id);

    setIsSaving(false);
    if (!error) {
      onItemUpdated();
      onClose();
    } else {
      console.error("Update failed:", error.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("item_details")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>{t("product_name")}</Label>
            <Input
              value={updatedItem.product_name}
              onChange={(e) => setUpdatedItem({ ...updatedItem, product_name: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("quantity")}</Label>
              <Input
                type="number"
                value={updatedItem.quantity}
                onChange={(e) => setUpdatedItem({ ...updatedItem, quantity: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>{t("unit_price")}</Label>
              <Input
                type="number"
                step="0.01"
                value={updatedItem.unit_price}
                onChange={(e) => setUpdatedItem({ ...updatedItem, unit_price: Number(e.target.value) })}
              />
            </div>
          </div>
          
          <div>
            <Label>{t("total_price")}</Label>
            <Input
              type="number"
              value={(updatedItem.quantity * updatedItem.unit_price).toFixed(2)}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div>
            <Label>{t("supplier")}</Label>
            <Select
              value={updatedItem.supplier_id || ""}
              onValueChange={(value) => setUpdatedItem({ ...updatedItem, supplier_id: value || null })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select_supplier")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("no_supplier")}</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t("upload_image")}</Label>
            <ImageUpload
              id={item.id}
              table="order_items"
              storagePath="order_images"
              field="image_url"
            />
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailsDialog;
