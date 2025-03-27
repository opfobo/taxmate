import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Edit, X, ShoppingBag, Clock, CreditCard } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Consumer, ConsumerWithOrderStats } from "@/types/consumer";
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import ConsumerForm from "./ConsumerForm";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface OrderData {
  id: string;
  order_number: string;
  status: string;
  order_date: string;
  amount: number;
  currency?: string;
}

interface ConsumerDetailsDrawerProps {
  consumer: ConsumerWithOrderStats;
  onClose: () => void;
  onConsumerUpdated: () => void;
}

const ConsumerDetailsDrawer: React.FC<ConsumerDetailsDrawerProps> = ({
  consumer,
  onClose,
  onConsumerUpdated
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["consumer-orders", consumer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, order_date, amount, currency")
        .eq("consumer_id", consumer.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data || []) as OrderData[];
    },
  });

  const handleEditComplete = () => {
    setIsEditing(false);
    onConsumerUpdated();
  };

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="flex justify-between items-center pr-8">
          <SheetTitle>{consumer.full_name}</SheetTitle>
          <div className="flex">
            {!isEditing && (
              <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="ml-2">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6">
          {isEditing ? (
            <ConsumerForm
              existingConsumer={consumer}
              onComplete={handleEditComplete}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t("contact_information")}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm font-medium">{t("email")}</p>
                      <p className="text-sm">{consumer.email || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t("phone")}</p>
                      <p className="text-sm">{consumer.phone || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t("address_information")}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm font-medium">{t("address")}</p>
                      <p className="text-sm">{consumer.address_line1 || "-"}</p>
                      {consumer.address_line2 && (
                        <p className="text-sm">{consumer.address_line2}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t("location")}</p>
                      <p className="text-sm">
                        {[consumer.postal_code, consumer.city, consumer.region, consumer.country]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">{t("order_statistics")}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center justify-center bg-muted p-3 rounded-lg">
                    <ShoppingBag className="h-4 w-4 mb-1 text-primary" />
                    <p className="text-xl font-semibold">{consumer.total_orders || 0}</p>
                    <p className="text-xs text-muted-foreground">{t("total_orders")}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-muted p-3 rounded-lg">
                    <CreditCard className="h-4 w-4 mb-1 text-primary" />
                    <p className="text-xl font-semibold">
                      {formatCurrency(consumer.total_order_volume || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("total_volume")}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-muted p-3 rounded-lg">
                    <Clock className="h-4 w-4 mb-1 text-primary" />
                    <p className="text-xl font-semibold">
                      {consumer.last_order_date
                        ? format(new Date(consumer.last_order_date), "dd/MM/yy")
                        : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("last_order")}</p>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              {recentOrders.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">{t("recent_orders")}</h3>
                  <div className="space-y-2">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-3 border rounded-md flex justify-between items-center"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {order.order_number || order.id.substring(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.order_date 
                              ? format(new Date(order.order_date), "PP") 
                              : order.created_at 
                              ? format(new Date(order.created_at), "PP") 
                              : "-"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency(order.amount)}
                          </p>
                          <p className="text-xs capitalize text-muted-foreground">
                            {order.status || "-"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ConsumerDetailsDrawer;
