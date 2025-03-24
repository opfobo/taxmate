
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Shopper } from "@/types/shopper";
import { Transaction } from "@/pages/TransactionsPage";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { AlertCircle, Mail, Phone, MapPin, Calendar, Edit, ArrowLeft, Loader2 } from "lucide-react";
import OrdersTable from "@/components/orders/OrdersTable";
import TransactionsTable from "@/components/transactions/TransactionsTable";
import ShopperEditForm from "./ShopperEditForm";

interface ShopperDetailsDrawerProps {
  shopper: Shopper | null;
  open: boolean;
  onClose: () => void;
  onShopperUpdated?: () => void;
}

const ShopperDetailsDrawer = ({ 
  shopper, 
  open, 
  onClose,
  onShopperUpdated
}: ShopperDetailsDrawerProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("info");
  const [showEditForm, setShowEditForm] = useState(false);

  // Fetch shopper's orders
  const { data: orders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["shopper-orders", shopper?.id],
    queryFn: async () => {
      if (!shopper?.id) return [];
      
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("shopper_id", shopper.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      return data;
    },
    enabled: !!shopper?.id && open,
  });

  // Fetch shopper's transactions
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ["shopper-transactions", shopper?.id],
    queryFn: async () => {
      if (!shopper?.id) return [];
      
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("shopper_id", shopper.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      return data as Transaction[];
    },
    enabled: !!shopper?.id && open,
  });

  // Handle form submission from the edit form
  const handleEditComplete = () => {
    setShowEditForm(false);
    // Invalidate shopper data to refresh it
    queryClient.invalidateQueries({ queryKey: ["shoppers", user?.id] });
    if (onShopperUpdated) {
      onShopperUpdated();
    }
  };

  // Return early if no shopper
  if (!shopper) return null;

  // Format the full address
  const formatAddress = () => {
    const parts = [
      shopper.address_line1,
      shopper.address_line2,
      shopper.city && shopper.postal_code 
        ? `${shopper.postal_code} ${shopper.city}`
        : shopper.city || shopper.postal_code,
      shopper.region,
      shopper.country
    ].filter(Boolean);
    
    return parts.join(", ");
  };

  // Function to handle view details of an order
  const handleViewOrderDetails = (order: any) => {
    // This would ideally open the order details modal/drawer
    console.log("View order details:", order);
  };

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-2" 
            onClick={onClose}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("back")}
          </Button>
          <DrawerTitle className="text-2xl">
            {shopper.salutation && `${shopper.salutation} `}
            {shopper.first_name} {shopper.last_name}
          </DrawerTitle>
          <DrawerDescription>
            {t("shopper_since")} {format(new Date(shopper.created_at), "PP")}
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 md:p-6 overflow-y-auto">
          {showEditForm ? (
            <div className="mb-4">
              <Button 
                variant="outline" 
                onClick={() => setShowEditForm(false)}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("back_to_details")}
              </Button>
              <ShopperEditForm 
                shopper={shopper} 
                onComplete={handleEditComplete} 
                onCancel={() => setShowEditForm(false)} 
              />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="info">{t("personal_info")}</TabsTrigger>
                <TabsTrigger value="orders">{t("orders")}</TabsTrigger>
                <TabsTrigger value="transactions">{t("transactions")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{t("contact_information")}</CardTitle>
                      <Button variant="outline" onClick={() => setShowEditForm(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        {t("edit")}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Email */}
                      <div className="flex items-start gap-2">
                        <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{t("email")}</p>
                          <p className="text-muted-foreground">{shopper.email || t("not_provided")}</p>
                        </div>
                      </div>
                      
                      {/* Phone */}
                      <div className="flex items-start gap-2">
                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{t("phone")}</p>
                          <p className="text-muted-foreground">{shopper.phone || t("not_provided")}</p>
                        </div>
                      </div>
                      
                      {/* Address */}
                      <div className="flex items-start gap-2 col-span-1 md:col-span-2">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{t("address")}</p>
                          <p className="text-muted-foreground">{formatAddress() || t("not_provided")}</p>
                        </div>
                      </div>
                      
                      {/* Registration Date */}
                      <div className="flex items-start gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{t("registered_on")}</p>
                          <p className="text-muted-foreground">
                            {format(new Date(shopper.created_at), "PPP")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("order_history")}</CardTitle>
                    <CardDescription>
                      {t("showing_all_orders_for_this_shopper")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isOrdersLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : orders && orders.length > 0 ? (
                      <OrdersTable 
                        orders={orders} 
                        isLoading={false} 
                        onViewDetails={handleViewOrderDetails}
                        orderType="fulfillment"
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>{t("no_orders_found")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("transaction_history")}</CardTitle>
                    <CardDescription>
                      {t("showing_all_transactions_for_this_shopper")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isTransactionsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : transactions && transactions.length > 0 ? (
                      <TransactionsTable transactions={transactions} />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>{t("no_transactions_found")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
        
        {!showEditForm && (
          <DrawerFooter className="border-t">
            <Button variant="outline" onClick={onClose}>
              {t("close")}
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default ShopperDetailsDrawer;
