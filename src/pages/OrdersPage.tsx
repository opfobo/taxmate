import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, ShoppingBag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OrdersTable from "@/components/orders/OrdersTable";
import OrderForm from "@/components/orders/OrderForm";
import OrderDetailsDialog from "@/components/orders/OrderDetailsDialog";
import SupplierForm from "@/components/orders/SupplierForm";
import StatusFilter from "@/components/orders/StatusFilter";
import DateRangePicker from "@/components/orders/DateRangePicker";
import Navbar from "@/components/Navbar"; // ✅ NEU hinzugefügt
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

const OrdersPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"fulfillment" | "supplier">("fulfillment");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);

  const handleViewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleAddOrder = () => setIsOrderFormOpen(true);
  const handleAddSupplier = () => setIsSupplierFormOpen(true);
  const handleTabChange = (tab: "fulfillment" | "supplier") => {
    setActiveTab(tab);
    setSearchQuery("");
    setStatusFilter(null);
    setDateRange({ from: undefined, to: undefined });
  };

  const handleOrderCreated = () => {
    refetch();
    setIsOrderFormOpen(false);
    toast({ title: t("order_created"), description: t("order_created_successfully") });
  };

  const handleSupplierCreated = () => {
    setIsSupplierFormOpen(false);
    toast({ title: t("supplier_added"), description: t("supplier_added_successfully") });
  };

  const fetchOrders = async () => {
    let query = supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        total_price,
        currency,
        order_date,
        image_urls,
        notes,
        supplier:suppliers(name),
        order_items(*)
      `)
      .eq("type", activeTab)
      .eq("shopper_id", user?.id || "")
      .order("order_date", { ascending: false });

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
    if (error) throw new Error(error.message);
    return data || [];
  };

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["orders", activeTab, searchQuery, statusFilter, dateRange],
    queryFn: fetchOrders,
    enabled: !!user,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6">{t("orders")}</h1>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="fulfillment" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              {t("fulfillment_orders")}
            </TabsTrigger>
            <TabsTrigger value="supplier" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {t("supplier_orders")}
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={`${t("search")} ${t("orders")}...`}
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
            <DateRangePicker value={dateRange} onChange={setDateRange} />

            {activeTab === "supplier" && (
              <Button variant="outline" onClick={handleAddSupplier} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {t("add_supplier")}
              </Button>
            )}
            <Button onClick={handleAddOrder} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("add_order")}
            </Button>
          </div>

          <TabsContent value={activeTab}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>
                  {activeTab === "fulfillment"
                    ? t("fulfillment_orders")
                    : t("supplier_orders")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OrdersTable
                  orders={orders}
                  isLoading={isLoading}
                  onViewDetails={handleViewOrderDetails}
                  orderType={activeTab}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {selectedOrder && (
          <OrderDetailsDialog
            order={selectedOrder}
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            onOrderUpdated={refetch}
          />
        )}

        <OrderForm
          isOpen={isOrderFormOpen}
          onClose={() => setIsOrderFormOpen(false)}
          onOrderCreated={handleOrderCreated}
          orderType={activeTab}
        />

        <SupplierForm
          isOpen={isSupplierFormOpen}
          onClose={() => setIsSupplierFormOpen(false)}
          onSupplierCreated={handleSupplierCreated}
        />
      </main>
    </div>
  );
};

export default OrdersPage;
