import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { ConsumerWithOrderStats } from "@/types/consumer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Edit, X, ShoppingBag, Clock, CreditCard } from "lucide-react";
import ConsumerForm from "@/components/consumers/ConsumerForm";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ConsumerDetailsDrawerProps {
  consumer: ConsumerWithOrderStats;
  onClose: () => void;
  onConsumerUpdated: () => void;
}

interface OrderData {
  id: string;
  order_number: string | null;
  order_date: string | null;
  amount: number | string;
  status: string | null;
}

const ConsumerDetailsDrawer = ({
  consumer,
  onClose,
  onConsumerUpdated,
}: ConsumerDetailsDrawerProps) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  // Typisierung direkt hier, um TypeScript zu entlasten
  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery<OrderData[]>({
    queryKey: ["consumer-orders", consumer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, order_date, amount, status")
        .eq("consumer_id", consumer.id)
        .order("order_date", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
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
              {/* Kontaktinformationen */}
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

              {/* Statistiken */}
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

              {/* Letzte Bestellungen */}
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
                            {order.order_date ? format(new Date(order.order_date), "PP") : "-"}
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
