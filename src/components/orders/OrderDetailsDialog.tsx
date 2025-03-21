
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";
import { ImagePlus, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";
import OrderStatusUpdateForm from "./OrderStatusUpdateForm";
import OrderItemsTable from "./OrderItemsTable";
import { Badge } from "@/components/ui/badge";
import ItemDetailsDialog from "./ItemDetailsDialog";

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
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isItemDetailsOpen, setIsItemDetailsOpen] = useState(false);

  useEffect(() => {
    if (order) {
      // Handle image_urls as an array or convert single image_url to array
      if (order.image_urls && Array.isArray(order.image_urls)) {
        setImageUrls(order.image_urls);
      } else if (order.image_url) {
        // For backward compatibility with single image_url
        const urls = typeof order.image_url === 'string' && order.image_url.includes(',')
          ? order.image_url.split(',')
          : order.image_url ? [order.image_url] : [];
        setImageUrls(urls);
      } else {
        setImageUrls([]);
      }

      if (order?.id) {
        fetchOrderItems();
      }
    }
  }, [order]);

  const fetchOrderItems = async () => {
    if (!order?.id) return;
    
    setLoadingItems(true);
    const { data, error } = await supabase
      .from("order_items")
      .select(`
        *,
        supplier:suppliers(name)
      `)
      .eq("order_id", order.id);

    setLoadingItems(false);
    if (error) {
      console.error("Error fetching order items:", error);
      toast({
        title: t("error"),
        description: t("error_fetching_order_items"),
        variant: "destructive",
      });
      return;
    }

    setOrderItems(data || []);
  };

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
      const newImageList = [...imageUrls, ...uploadedUrls];
      
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

  const handleAddOrderItem = async () => {
    if (!order?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("order_items")
        .insert({
          order_id: order.id,
          product_name: t("new_product"),
          quantity: 1,
          unit_price: 0,
          total_price: 0
        })
        .select()
        .single();
        
      if (error) throw error;
      
      fetchOrderItems();
      
      // Open item details dialog to edit the new item
      if (data) {
        setSelectedItem(data);
        setIsItemDetailsOpen(true);
      }
      
    } catch (error: any) {
      console.error("Error adding order item:", error.message);
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewItemDetails = (item: any) => {
    setSelectedItem(item);
    setIsItemDetailsOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-blue-100 text-blue-800";
      case "declined": return "bg-red-100 text-red-800";
      case "processing": return "bg-purple-100 text-purple-800";
      case "shipped": return "bg-indigo-100 text-indigo-800";
      case "delivered": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("order_details")}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <strong>{t("order_number")}:</strong> {order.order_number}
              </div>
              <div>
                <strong>{t("order_date")}:</strong>{" "}
                {order.order_date && format(new Date(order.order_date), "PPP")}
              </div>
              <div>
                <strong>{t("status")}:</strong>{" "}
                <Badge className={getStatusColor(order.status)}>
                  {t(order.status)}
                </Badge>
              </div>
              <div>
                <strong>{t("total_price")}:</strong> {order.amount} {order.currency}
              </div>
              {order.supplier && (
                <div>
                  <strong>{t("supplier")}:</strong> {order.supplier.name}
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {order.notes && (
                <div>
                  <strong>{t("notes")}:</strong> {order.notes}
                </div>
              )}
              
              <div>
                <strong>{t("update_status")}:</strong>
                <OrderStatusUpdateForm 
                  orderId={order.id} 
                  currentStatus={order.status}
                  onUpdated={onOrderUpdated}
                />
              </div>
            </div>
          </div>

          {/* Images Gallery */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <strong>{t("images")}:</strong>
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
                  size="sm"
                >
                  <ImagePlus className="w-4 h-4" />
                  {uploading ? t("uploading") : t("add_picture")}
                </Button>
              </label>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {imageUrls.length > 0 ? (
                imageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`${t("order")}-${t("image")}-${index}`}
                    className="rounded-md w-full h-auto object-cover border"
                  />
                ))
              ) : (
                <p className="text-muted-foreground">{t("no_images")}</p>
              )}
            </div>
          </div>

          {/* Order Items Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <strong>{t("order_items")}:</strong>
              <Button 
                onClick={handleAddOrderItem}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t("add_item")}
              </Button>
            </div>
            
            {loadingItems ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <OrderItemsTable 
                items={orderItems} 
                onViewItem={handleViewItemDetails}
              />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
      
      {selectedItem && (
        <ItemDetailsDialog
          isOpen={isItemDetailsOpen}
          onClose={() => setIsItemDetailsOpen(false)}
          item={selectedItem}
          orderId={order.id}
          onItemUpdated={fetchOrderItems}
        />
      )}
    </Dialog>
  );
};

export default OrderDetailsDialog;
