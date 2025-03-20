
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Plus, Trash, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
  orderType: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  supplier_id?: string | null;
}

const generateOrderNumber = () => {
  const prefix = "ORD";
  const randomNumber = Math.floor(Math.random() * 1000000);
  return `${prefix}-${randomNumber.toString().padStart(6, "0")}`;
};

const OrderForm = ({
  isOpen,
  onClose,
  onOrderCreated,
  orderType,
}: OrderFormProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orderNumber, setOrderNumber] = useState(generateOrderNumber());
  const [status, setStatus] = useState("pending");
  const [currency, setCurrency] = useState("EUR");
  const [notes, setNotes] = useState("");
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItem[]>([
    {
      id: `temp-${Math.random().toString(36).substring(2)}`,
      product_name: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("suppliers")
          .select("*")
          .eq("user_id", user?.id || "");

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        return [];
      }
    },
    enabled: !!user && orderType === "supplier",
  });

  useEffect(() => {
    if (isOpen) {
      setOrderNumber(generateOrderNumber());
      setStatus("pending");
      setCurrency("EUR");
      setNotes("");
      setSupplierId(null);
      setItems([
        {
          id: `temp-${Math.random().toString(36).substring(2)}`,
          product_name: "",
          quantity: 1,
          unit_price: 0,
          total_price: 0,
        },
      ]);
    }
  }, [isOpen]);

  const updateItemTotalPrice = (index: number) => {
    const newItems = [...items];
    const item = newItems[index];
    item.total_price = item.quantity * item.unit_price;
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === "quantity" || field === "unit_price") {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: `temp-${Math.random().toString(36).substring(2)}`,
        product_name: "",
        quantity: 1,
        unit_price: 0,
        total_price: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const calculateTotalPrice = () => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.some(item => !item.product_name || item.quantity <= 0)) {
      toast({
        title: t("validation_error"),
        description: t("please_fill_all_item_fields"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the order
      const orderData = {
        order_number: orderNumber,
        shopper_id: user?.id,
        type: orderType,
        status,
        currency,
        notes,
        total_price: calculateTotalPrice(),
        amount: calculateTotalPrice(), // For compatibility with existing orders table
        supplier_id: supplierId,
        order_date: new Date().toISOString(),
      };

      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = items.map(item => ({
        order_id: newOrder.id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        supplier_id: item.supplier_id || supplierId,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      onOrderCreated();
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {orderType === "fulfillment" 
              ? t("add_fulfillment_order") 
              : t("add_supplier_order")}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">{t("order_number")}</Label>
              <Input
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">{t("status")}</Label>
              <Select
                value={status}
                onValueChange={setStatus}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder={t("select_status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t("pending")}</SelectItem>
                  <SelectItem value="accepted">{t("accepted")}</SelectItem>
                  <SelectItem value="processing">{t("processing")}</SelectItem>
                  <SelectItem value="shipped">{t("shipped")}</SelectItem>
                  <SelectItem value="delivered">{t("delivered")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">{t("currency")}</Label>
              <Select
                value={currency}
                onValueChange={setCurrency}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder={t("select_currency")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {orderType === "supplier" && suppliers && suppliers.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="supplier">{t("supplier")}</Label>
                <Select
                  value={supplierId || ""}
                  onValueChange={setSupplierId}
                >
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder={t("select_supplier")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("none")}</SelectItem>
                    {suppliers.map((supplier: any) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notes_placeholder")}
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{t("items")}</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addItem}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                {t("add_item")}
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("product_name")}</TableHead>
                    <TableHead>{t("quantity")}</TableHead>
                    <TableHead>{t("unit_price")}</TableHead>
                    <TableHead>{t("total_price")}</TableHead>
                    {orderType === "supplier" && suppliers && suppliers.length > 0 && (
                      <TableHead>{t("supplier")}</TableHead>
                    )}
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          value={item.product_name}
                          onChange={(e) => 
                            handleItemChange(index, "product_name", e.target.value)
                          }
                          placeholder={t("product_name")}
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => 
                            handleItemChange(index, "quantity", parseInt(e.target.value))
                          }
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => 
                            handleItemChange(index, "unit_price", parseFloat(e.target.value))
                          }
                          required
                        />
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("de-DE", {
                          style: "currency",
                          currency: currency,
                        }).format(item.total_price)}
                      </TableCell>
                      {orderType === "supplier" && suppliers && suppliers.length > 0 && (
                        <TableCell>
                          <Select
                            value={item.supplier_id || ""}
                            onValueChange={(value) => 
                              handleItemChange(index, "supplier_id", value || null)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_supplier")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">{t("default_supplier")}</SelectItem>
                              {suppliers.map((supplier: any) => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-end">
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-lg font-medium">
                  {t("total")}: {new Intl.NumberFormat("de-DE", {
                    style: "currency",
                    currency: currency,
                  }).format(calculateTotalPrice())}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  {t("creating")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {t("create_order")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;
