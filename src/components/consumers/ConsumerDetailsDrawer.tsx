
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Consumer } from "@/types/consumer";
import { Transaction } from "@/pages/TransactionsPage";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { ArrowLeft, Calendar, Loader2, Mail, MapPin, Phone, Edit } from "lucide-react";
import OrdersTable from "@/components/orders/OrdersTable";
import TransactionsTable from "@/components/transactions/TransactionsTable";
import ConsumerEditForm from "./ConsumerEditForm";

interface ConsumerDetailsDrawerProps {
  consumer: Consumer | null;
  open: boolean;
  onClose: () => void;
  onConsumerUpdated?: () => void;
}

// Define explicit types to avoid deep type instantiation
interface OrderData {
  id: string;
  user_id: string;
  order_type: string;
  status: string;
  amount: number;
  order_date: string;
  created_at: string;
  updated_at: string;
  [key: string]: any; // For any other fields
}

const ConsumerDetailsDrawer = ({ 
  consumer, 
  open, 
  onClose,
  onConsumerUpdated
}: ConsumerDetailsDrawerProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("info");
  const [showEditForm, setShowEditForm] = useState(false);

  const { data: orders = [], isLoading: isOrdersLoading } = useQuery<OrderData[], Error>({
    queryKey: ["user-orders", consumer?.id],
    queryFn: async () => {
      if (!consumer?.id) return [];
      
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", consumer.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Ensure the returned data matches OrderData interface
      return (data || []).map(item => ({
        ...item,
        order_type: item.order_type || 'unknown'
      })) as OrderData[];
    },
    enabled: !!consumer?.id && open,
  });

  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery<Transaction[], Error>({
    queryKey: ["user-transactions", consumer?.id],
    queryFn: async () => {
      if (!consumer?.id) return [];
      
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", consumer.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      return data as Transaction[] || [];
    },
    enabled: !!consumer?.id && open,
  });

  const handleEditComplete = () => {
    setShowEditForm(false);
    queryClient.invalidateQueries({ queryKey: ["consumers", user?.id] });
    if (onConsumerUpdated) {
      onConsumerUpdated();
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    console.log("Edit transaction:", transaction);
  };

  const handleDeleteTransaction = (id: string) => {
    console.log("Delete transaction:", id);
  };

  if (!consumer) return null;

  const formatAddress = () => {
    const parts = [
      consumer.address_line1,
      consumer.address_line2,
      consumer.city && consumer.postal_code 
        ? `${consumer.postal_code} ${consumer.city}`
        : consumer.city || consumer.postal_code,
      consumer.region,
      consumer.country
    ].filter(Boolean);
    
    return parts.join(", ");
  };

  const handleViewOrderDetails = (order: any) => {
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
            {consumer.full_name}
          </DrawerTitle>
          <DrawerDescription>
            {t("consumer_since")} {format(new Date(consumer.created_at || new Date()), "PP")}
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
              <ConsumerEditForm 
                consumer={consumer} 
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
                      <div className="flex items-start gap-2">
                        <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{t("email")}</p>
                          <p className="text-muted-foreground">{consumer.email || t("not_provided")}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{t("phone")}</p>
                          <p className="text-muted-foreground">{consumer.phone || t("not_provided")}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 col-span-1 md:col-span-2">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{t("address")}</p>
                          <p className="text-muted-foreground">{formatAddress() || t("not_provided")}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{t("registered_on")}</p>
                          <p className="text-muted-foreground">
                            {format(new Date(consumer.created_at || new Date()), "PPP")}
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
                      {t("showing_all_orders_for_this_consumer")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isOrdersLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : orders.length > 0 ? (
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
                      {t("showing_all_transactions_for_this_consumer")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isTransactionsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : transactions.length > 0 ? (
                      <TransactionsTable 
                        transactions={transactions} 
                        onEdit={handleEditTransaction}
                        onDelete={handleDeleteTransaction}
                      />
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

export default ConsumerDetailsDrawer;
