
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Eye, ImagePlus } from "lucide-react";
import { format } from "date-fns";
import ImageUpload from "./ImageUpload";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ItemDetailsDialog from "./ItemDetailsDialog";

interface OrderItemsTableProps {
  items: any[];
  orderType: string;
  onOrderUpdated: () => void;
}

const OrderItemsTable = ({ items, orderType, onOrderUpdated }: OrderItemsTableProps) => {
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  const [isItemDetailsOpen, setIsItemDetailsOpen] = useState(false);

  const handleUploadSuccess = () => {
    toast({
      title: t("image_uploaded"),
      description: t("image_uploaded_successfully"),
    });
    setIsImageUploadOpen(false);
    onOrderUpdated();
  };

  const handleViewItemDetails = (item: any) => {
    setSelectedItem(item);
    setIsItemDetailsOpen(true);
  };

  const handleImageUpload = (item: any) => {
    setSelectedItem(item);
    setIsImageUploadOpen(true);
  };

  if (!items.length) {
    return (
      <div className="py-8 text-center">
        <p>{t("no_items")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("product_name")}</TableHead>
              <TableHead>{t("quantity")}</TableHead>
              <TableHead>{t("unit_price")}</TableHead>
              <TableHead>{t("total_price")}</TableHead>
              {orderType === "supplier" && <TableHead>{t("supplier")}</TableHead>}
              <TableHead>{t("image")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.product_name}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  }).format(item.unit_price)}
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  }).format(item.total_price)}
                </TableCell>
                {orderType === "supplier" && (
                  <TableCell>{item.supplier?.name || "-"}</TableCell>
                )}
                <TableCell>
                  {item.image_url ? (
                    <img 
                      src={`${supabase.storage.from("order_images").getPublicUrl(item.image_url).data.publicUrl}`} 
                      alt={item.product_name} 
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewItemDetails(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleImageUpload(item)}
                    >
                      <ImagePlus className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedItem && (
        <>
          <ImageUpload
            isOpen={isImageUploadOpen}
            onClose={() => setIsImageUploadOpen(false)}
            onSuccess={handleUploadSuccess}
            orderId={selectedItem.id}
            type="item"
            existingImage={selectedItem.image_url}
          />
          
          <ItemDetailsDialog
            item={selectedItem}
            isOpen={isItemDetailsOpen}
            onClose={() => setIsItemDetailsOpen(false)}
            onItemUpdated={onOrderUpdated}
          />
        </>
      )}
    </>
  );
};

export default OrderItemsTable;
