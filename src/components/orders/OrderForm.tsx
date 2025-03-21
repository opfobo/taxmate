import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { Loader2, Plus } from "lucide-react";

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
  orderType: "fulfillment" | "supplier";
}

const OrderForm = ({ isOpen, onClose, onOrderCreated, orderType }: OrderFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [currency, setCurrency] = useState("EUR");

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      const { error } = await supabase.from("orders").insert({
        shopper_id: user.id,
        type: orderType,
        order_number: orderNumber,
        total_price: parseFloat(totalPrice),
        currency,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      onOrderCreated();
    } catch (error: any) {
      console.error("Error creating order:", error.message);
      toast({
        title: t("error"),
        description: error.message || t("order_create_failed"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setOrderNumber("");
      setTotalPrice("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <div className="space-y-4">
          <h2 className="text-xl font-bold">{t("add_order")}</h2>

          <div className="space-y-2">
            <Label htmlFor="order-number">{t("order_number")}</Label>
            <Input
              id="order-number"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. 2024-00123"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total-price">{t("total_price")}</Label>
            <Input
              id="total-price"
              type="number"
              step="0.01"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">{t("currency")}</Label>
            <Input
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="EUR"
            />
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {t("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;
