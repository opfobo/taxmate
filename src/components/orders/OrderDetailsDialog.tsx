
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PackageCheck, 
  Truck, 
  X, 
  CheckCircle,
  Upload,
  FileDown,
  Clock,
  RefreshCw,
  ImagePlus,
  Trash
} from "lucide-react";
import OrderStatusUpdateForm from "./OrderStatusUpdateForm";
import OrderItemsTable from "./OrderItemsTable";
import ImageUpload from "./ImageUpload";

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
  onOrderUpdated 
}: OrderDetailsDialogProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("details");
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);

  // Fetch order items
  const { data: orderItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["orderItems", order.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*, supplier:suppliers(name)")
        .eq("order_id", order.id);

      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ 
          status,
          notes: notes || order.notes,
          updated_at: new Date().toISOString()
        })
        .eq("id", order.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: t("status_updated"),
        description: t("order_status_updated_successfully"),
      });
      onOrderUpdated();
      setIsStatusUpdateOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUploadSuccess = () => {
    toast({
      title: t("image_uploaded"),
      description: t("image_uploaded_successfully"),
    });
    setIsImageUploadOpen(false);
    onOrderUpdated();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "accepted":
        return "bg-blue-500";
      case "processing":
        return "bg-purple-500";
      case "shipped":
        return "bg-orange-500";
      case "delivered":
        return "bg-green-500";
      case "declined":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusActions = () => {
    const actions = [];

    switch (order.status) {
      case "pending":
        actions.push(
          <Button 
            key="accept" 
            variant="outline" 
            className="gap-2"
            onClick={() => updateStatusMutation.mutate({ status: "accepted" })}
          >
            <CheckCircle className="h-4 w-4" />
            {t("accept")}
          </Button>,
          <Button 
            key="decline" 
            variant="outline" 
            className="gap-2 border-red-500 hover:bg-red-50"
            onClick={() => updateStatusMutation.mutate({ status: "declined" })}
          >
            <X className="h-4 w-4 text-red-500" />
            {t("decline")}
          </Button>
        );
        break;
      case "accepted":
        actions.push(
          <Button 
            key="process" 
            variant="outline" 
            className="gap-2"
            onClick={() => updateStatusMutation.mutate({ status: "processing" })}
          >
            <RefreshCw className="h-4 w-4" />
            {t("processing")}
          </Button>
        );
        break;
      case "processing":
        actions.push(
          <Button 
            key="ship" 
            variant="outline" 
            className="gap-2"
            onClick={() => updateStatusMutation.mutate({ status: "shipped" })}
          >
            <Truck className="h-4 w-4" />
            {t("ship")}
          </Button>
        );
        break;
      case "shipped":
        actions.push(
          <Button 
            key="deliver" 
            variant="outline" 
            className="gap-2"
            onClick={() => updateStatusMutation.mutate({ status: "delivered" })}
          >
            <PackageCheck className="h-4 w-4" />
            {t("mark_delivered")}
          </Button>
        );
        break;
    }

    return actions;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("order_details")}</DialogTitle>
          <DialogDescription>
            {t("order_number")}: {order.order_number}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="details">{t("details")}</TabsTrigger>
            <TabsTrigger value="items">{t("items")}</TabsTrigger>
            <TabsTrigger value="images">{t("images")}</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t("order_date")}
                </h3>
                <p>{format(new Date(order.order_date), "PPP")}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t("status")}
                </h3>
                <Badge variant="outline" className={`${getStatusColor(order.status)} text-white`}>
                  {t(order.status)}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t("total_price")}
                </h3>
                <p>
                  {new Intl.NumberFormat("de-DE", {
                    style: "currency",
                    currency: order.currency || "EUR",
                  }).format(order.total_price || order.amount)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {order.type === "supplier" ? t("supplier") : t("customer")}
                </h3>
                <p>{order.supplier?.name || "-"}</p>
              </div>
            </div>

            {order.notes && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t("notes")}
                </h3>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {getStatusActions()}
              
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setIsStatusUpdateOpen(true)}
              >
                <Clock className="h-4 w-4" />
                {t("update_status")}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="items">
            {itemsLoading ? (
              <div className="py-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>{t("loading")}</p>
              </div>
            ) : (
              <OrderItemsTable 
                items={orderItems || []} 
                orderType={order.type} 
                onOrderUpdated={onOrderUpdated}
              />
            )}
          </TabsContent>

          <TabsContent value="images">
            <div className="grid grid-cols-1 gap-4">
              {order.image_url ? (
                <div className="border rounded-lg overflow-hidden">
                  <img 
                    src={`${supabase.storage.from("order_images").getPublicUrl(order.image_url).data.publicUrl}`} 
                    alt={t("order_image")} 
                    className="w-full h-auto"
                  />
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <p className="text-muted-foreground mb-4">{t("no_order_images")}</p>
                </div>
              )}

              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setIsImageUploadOpen(true)}
              >
                <ImagePlus className="h-4 w-4" />
                {order.image_url ? t("update_image") : t("add_image")}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            {t("close")}
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            {t("download_invoice")}
          </Button>
        </DialogFooter>
      </DialogContent>

      <OrderStatusUpdateForm
        isOpen={isStatusUpdateOpen}
        onClose={() => setIsStatusUpdateOpen(false)}
        onStatusUpdate={(status, notes) => 
          updateStatusMutation.mutate({ status, notes })
        }
        currentStatus={order.status}
        currentNotes={order.notes}
      />

      <ImageUpload
        isOpen={isImageUploadOpen}
        onClose={() => setIsImageUploadOpen(false)}
        onSuccess={handleUploadSuccess}
        orderId={order.id}
        type="order"
        existingImage={order.image_url}
      />
    </Dialog>
  );
};

export default OrderDetailsDialog;
