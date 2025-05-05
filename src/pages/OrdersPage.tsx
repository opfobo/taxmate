import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { 
  Plus,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import Navbar from "@/components/Navbar";
import EmptyState from "@/components/dashboard/EmptyState";
import OrderDetailsDialog from "@/components/orders/OrderDetailsDialog";
import OrderForm from "@/components/orders/OrderForm";
import { SupplierForm } from "@/components/orders/SupplierForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { OrderType } from "@/types/order";

const OrdersPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);

  const fetchOrders = async (): Promise<any[]> => {
    try {
      let query = supabase
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          amount,
          currency,
          order_date,
          image_url,
          notes,
          supplier:suppliers(id, name),
          order_items(id),
          order_type
        `)
        .eq("user_id", user?.id || "")
        .order("order_date", { ascending: false })
        .range(0, 50);

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching orders:", error);
        toast({
          title: t("error"),
          description: t("error_fetching_orders"),
          variant: "destructive",
        });
        throw new Error(error.message);
      }

      const ordersWithType = data?.map(order => ({
        ...order,
        order_type: order.order_type || "fulfillment" as OrderType
      })) || [];

      for (const order of ordersWithType) {
        try {
          const { data: imageList, error: imageError } = await supabase.storage
            .from("order-images")
            .list(`order-${order.id}`);
          
          if (!imageError && imageList && imageList.length > 0) {
            const imageUrls = await Promise.all(
              imageList.map(async (file) => {
                const { data: url } = supabase.storage
                  .from("order-images")
                  .getPublicUrl(`order-${order.id}/${file.name}`);
                return url.publicUrl;
              })
            );
            
            if (imageUrls.length > 0) {
              order.image_url = imageUrls[0];
              order.notes = JSON.stringify({
                originalNotes: order.notes,
                imageUrls: imageUrls
              });
            }
          }
        } catch (imageError) {
          console.error(`Error fetching images for order ${order.id}:`, imageError);
        }
      }

      return ordersWithType;
    } catch (error) {
      console.error("Error in fetchOrders:", error);
      return [];
    }
  };

  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    enabled: !!user,
  });

  const handleViewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setIsOrderFormOpen(true);
  };

  const handleAddOrder = () => {
    setEditingOrder(null);
    setIsOrderFormOpen(true);
  };

  const handleOrderCreated = () => {
    refetch();
    setIsOrderFormOpen(false);
    setEditingOrder(null);
  };

  const handleSupplierCreated = () => {
    setIsSupplierFormOpen(false);
    toast({
      title: t("supplier_added"),
      description: t("supplier_added_successfully"),
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`;
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t("orders.title")}</h1>
          <Button onClick={handleAddOrder} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("orders.addOrder")}
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("orders.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <EmptyState 
                icon={AlertTriangle}
                title={t("error_loading_orders")}
                description={t("try_again_later")}
              />
            ) : isLoading ? (
              <div className="flex justify-center p-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : orders.length === 0 ? (
              <EmptyState 
                icon={AlertTriangle}
                title={t("orders.noOrders")}
                description=""
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("orders.orderNumber")}</TableHead>
                      <TableHead>{t("orders.status")}</TableHead>
                      <TableHead>{t("orders.date")}</TableHead>
                      <TableHead>{t("orders.totalAmount")}</TableHead>
                      <TableHead>{t("orders.consumer")}</TableHead>
                      <TableHead>{t("orders.type")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow 
                        key={order.id}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleViewOrderDetails(order)}
                      >
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs 
                            ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'}`
                          }>
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(order.order_date)}</TableCell>
                        <TableCell>{formatAmount(order.amount, order.currency)}</TableCell>
                        <TableCell>{order.consumer?.name || "-"}</TableCell>
                        <TableCell>{order.order_type}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditOrder(order);
                            }}
                          >
                            {t("edit")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedOrder && (
          <OrderDetailsDialog
            order={selectedOrder}
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            onOrderUpdated={() => refetch()}
          />
        )}

        <OrderForm
          isOpen={isOrderFormOpen}
          onClose={() => {
            setIsOrderFormOpen(false);
            setEditingOrder(null);
          }}
          onOrderCreated={handleOrderCreated}
          orderType="fulfillment"
          editOrder={editingOrder}
        />

        <SupplierForm
          isOpen={isSupplierFormOpen}
          onClose={() => setIsSupplierFormOpen(false)}
          onSupplierCreated={handleSupplierCreated}
        />
      </div>
    </>
  );
};

export default OrdersPage;
