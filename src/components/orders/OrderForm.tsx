
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [notes, setNotes] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  useEffect(() => {
    if (isOpen && orderType === "supplier") {
      fetchSuppliers();
    }
  }, [isOpen, orderType]);

  const fetchSuppliers = async () => {
    if (!user) return;
    
    setLoadingSuppliers(true);
    const { data, error } = await supabase
      .from("suppliers")
      .select("id, name")
      .eq("user_id", user.id);
      
    setLoadingSuppliers(false);
    
    if (error) {
      console.error("Error fetching suppliers:", error);
      return;
    }
    
    setSuppliers(data || []);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      const now = new Date().toISOString();
      
      const orderData = {
        user_id: user.id,
        type: orderType,
        order_number: orderNumber,
        amount: parseFloat(totalPrice),
        currency,
        status: "pending",
        notes: notes || null,
        supplier_id: orderType === "supplier" ? selectedSupplierId : null,
        created_at: now,
        updated_at: now,
        order_date: now.split('T')[0], // Just the date part
      };

      const { error } = await supabase.from("orders").insert(orderData);

      if (error) throw error;

      onOrderCreated();
      resetForm();
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

  const resetForm = () => {
    setOrderNumber("");
    setTotalPrice("");
    setCurrency("EUR");
    setNotes("");
    setSelectedSupplierId(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
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

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {orderType === "supplier" && (
            <div className="space-y-2">
              <Label htmlFor="supplier">{t("supplier")}</Label>
              <Select
                value={selectedSupplierId || ""}
                onValueChange={(value) => setSelectedSupplierId(value || null)}
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder={t("select_supplier")} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingSuppliers && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  {t("loading_suppliers")}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("enter_notes")}
              rows={3}
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
