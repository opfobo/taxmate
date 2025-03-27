
import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Plus,
  X,
  Filter,
  AlertTriangle,
  Pencil 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OrdersTable from "@/components/orders/OrdersTable";
import OrderDetailsDialog from "@/components/orders/OrderDetailsDialog";
import OrderForm from "@/components/orders/OrderForm";
import { SupplierForm } from "@/components/orders/SupplierForm";
import DateRangePicker from "@/components/orders/DateRangePicker";
import StatusFilter from "@/components/orders/StatusFilter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DateRange } from "react-day-picker";
import EmptyState from "@/components/dashboard/EmptyState";

const PurchasesOrdersPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    return sessionStorage.getItem("purchasesOrdersSearchQuery") || "";
  });
  const [statusFilter, setStatusFilter] = useState<string | null>(() => {
    const savedStatus = sessionStorage.getItem("purchasesOrdersStatusFilter");
    return savedStatus ? savedStatus : null;
  });
  
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const savedRange = sessionStorage.getItem("purchasesOrdersDateRange");
    return savedRange ? JSON.parse(savedRange) : {
      from: undefined,
      to: undefined,
    };
  });
  
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);

  // Save filter state to sessionStorage when changed
  useEffect(() => {
    sessionStorage.setItem("purchasesOrdersSearchQuery", searchQuery);
    sessionStorage.setItem("purchasesOrdersStatusFilter", statusFilter || "");
    sessionStorage.setItem("purchasesOrdersDateRange", JSON.stringify(dateRange));
  }, [searchQuery, statusFilter, dateRange]);

  // Count active filters
  const activeFilterCount = [
    searchQuery.trim().length > 0,
    statusFilter !== null,
    dateRange.from !== undefined || dateRange.to !== undefined
  ].filter(Boolean).length;

  // Fetch orders with items and images
  const fetchOrders = async () => {
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
          order_items(id)
        `)
        .eq("user_id", user?.id || "")
        .eq("type", "supplier")
        .order("order_date", { ascending: false })
        .range(0, 50);

      if (searchQuery) {
        query = query.ilike("order_number", `%${searchQuery}%`);
      }

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      if (dateRange.from) {
        query = query.gte("order_date", format(dateRange.from, "yyyy-MM-dd"));
      }

      if (dateRange.to) {
        query = query.lte("order_date", format(dateRange.to, "yyyy-MM-dd"));
      }

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

      // For each order, fetch images from storage if available
      if (data && data.length > 0) {
        for (const order of data) {
          // Fetch images from storage for this order
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
      }

      return data || [];
    } catch (error) {
      console.error("Error in fetchOrders:", error);
      return [];
    }
  };

  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ["purchases-orders", searchQuery, statusFilter, dateRange],
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

  const handleAddSupplier = () => {
    setIsSupplierFormOpen(true);
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

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter(null);
    setDateRange({ from: undefined, to: undefined });
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`${t("search")} ${t("orders")}...`}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <StatusFilter
          value={statusFilter}
          onChange={setStatusFilter}
        />
        
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
        
        {activeFilterCount > 0 && (
          <Button 
            onClick={handleClearFilters} 
            variant="outline" 
            size="icon"
            className="flex-shrink-0"
            title={t("clear_filters")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        <Button onClick={handleAddSupplier} variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t("add_supplier")}
        </Button>
        
        <Button onClick={handleAddOrder} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t("add_order")}
        </Button>
      </div>

      {activeFilterCount > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t("active_filters")}:
          </span>
          <Badge variant="outline" className="font-mono">
            {activeFilterCount}
          </Badge>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{t("purchases")}</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <EmptyState 
              icon={AlertTriangle}
              title={t("error_loading_orders")}
              description={t("try_again_later")}
            />
          ) : (
            <OrdersTable
              orders={orders}
              isLoading={isLoading}
              onViewDetails={handleViewOrderDetails}
              onEditOrder={handleEditOrder}
              orderType="supplier"
            />
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
        orderType="supplier"
        editOrder={editingOrder}
      />

      <SupplierForm
        isOpen={isSupplierFormOpen}
        onClose={() => setIsSupplierFormOpen(false)}
        onSupplierCreated={handleSupplierCreated}
      />
    </>
  );
};

export default PurchasesOrdersPage;
