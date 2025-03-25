
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { 
  Calendar,
  Loader2, 
  Plus, 
  Save, 
  X,
  Hash,
  CreditCard,
  FileText
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import ImagePreview from "@/components/orders/ImagePreview";

// Define the form schema with Zod
const orderFormSchema = z.object({
  orderNumber: z.string().min(1, { message: "Order number is required" }),
  orderDate: z.string().optional(),
  totalPrice: z.string().min(1, { message: "Total price is required" }),
  currency: z.string().default("EUR"),
  status: z.string().default("pending"),
  notes: z.string().optional(),
  supplierId: z.string().optional().nullable(),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
  orderType: "fulfillment" | "supplier";
  editOrder?: any; // Optional order to edit
}

const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "canceled",
  "accepted",
  "declined"
];

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "JPY"];

const OrderForm = ({ 
  isOpen, 
  onClose, 
  onOrderCreated, 
  orderType,
  editOrder 
}: OrderFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Initialize the form with react-hook-form
  const form = useForm<OrderFormValues>({
    defaultValues: {
      orderNumber: "",
      orderDate: format(new Date(), "yyyy-MM-dd"),
      totalPrice: "",
      currency: "EUR",
      status: "pending",
      notes: "",
      supplierId: null,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (orderType === "supplier") {
        fetchSuppliers();
      }
      
      // Reset form when opening
      if (!editOrder) {
        form.reset({
          orderNumber: "",
          orderDate: format(new Date(), "yyyy-MM-dd"),
          totalPrice: "",
          currency: "EUR",
          status: "pending",
          notes: "",
          supplierId: null,
        });
        setImageUrls([]);
      } else {
        // Fill form with edit order data
        form.reset({
          orderNumber: editOrder.order_number || "",
          orderDate: editOrder.order_date ? format(new Date(editOrder.order_date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
          totalPrice: editOrder.amount?.toString() || "",
          currency: editOrder.currency || "EUR",
          status: editOrder.status || "pending",
          notes: editOrder.notes || "",
          supplierId: editOrder.supplier_id || null,
        });

        // Set image URLs if available
        if (editOrder.image_url) {
          setImageUrls([editOrder.image_url]);
        } else {
          setImageUrls([]);
        }

        // Check for additional images in notes
        if (editOrder.notes && editOrder.notes.startsWith('{') && editOrder.notes.includes('imageUrls')) {
          try {
            const parsedNotes = JSON.parse(editOrder.notes);
            if (Array.isArray(parsedNotes.imageUrls)) {
              setImageUrls(parsedNotes.imageUrls);
            }
          } catch (error) {
            console.error("Error parsing notes JSON:", error);
          }
        }
      }
    }
  }, [isOpen, orderType, editOrder, form]);

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
      toast({
        title: t("error"),
        description: t("error_fetching_suppliers"),
        variant: "destructive",
      });
      return;
    }
    
    setSuppliers(data || []);
  };

  const onSubmit = async (values: OrderFormValues) => {
    if (!user) return;

    setIsSaving(true);

    try {
      const now = new Date().toISOString();
      const orderDate = values.orderDate || format(new Date(), "yyyy-MM-dd");
      
      // Prepare notes with any existing image URLs
      let finalNotes = values.notes || null;
      if (imageUrls.length > 0) {
        finalNotes = JSON.stringify({
          originalNotes: values.notes || "",
          imageUrls: imageUrls
        });
      }
      
      const orderData = {
        user_id: user.id,
        type: orderType,
        order_number: values.orderNumber,
        amount: parseFloat(values.totalPrice),
        currency: values.currency,
        status: values.status,
        notes: finalNotes,
        supplier_id: orderType === "supplier" ? values.supplierId : null,
        created_at: editOrder ? undefined : now,
        updated_at: now,
        order_date: orderDate,
        // Set first image as primary image_url for compatibility
        image_url: imageUrls.length > 0 ? imageUrls[0] : null,
      };

      let error;
      
      if (editOrder) {
        // Update existing order
        const { error: updateError } = await supabase
          .from("orders")
          .update(orderData)
          .eq("id", editOrder.id);
        error = updateError;
      } else {
        // Insert new order
        const { error: insertError } = await supabase
          .from("orders")
          .insert(orderData);
        error = insertError;
      }

      if (error) throw error;

      onOrderCreated();
      onClose();
      
      toast({
        title: editOrder ? t("order_updated") : t("order_created"),
        description: editOrder ? t("order_updated_successfully") : t("order_created_successfully"),
      });
    } catch (error: any) {
      console.error("Error saving order:", error.message);
      toast({
        title: t("error"),
        description: error.message || t("order_save_failed"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <div className="space-y-4">
          <h2 className="text-xl font-bold">
            {editOrder ? t("edit_order") : t("add_order")}
          </h2>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("order_number")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder={t("order_number_placeholder")}
                          className="pl-9"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="orderDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("order_date")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="date"
                            className="pl-9"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("status")}</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_status")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ORDER_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {t(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="totalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("total_price")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CreditCard className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-9"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("currency")}</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_currency")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {orderType === "supplier" && (
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("supplier")}</FormLabel>
                      <Select
                        value={field.value || "none"}
                        onValueChange={(value) => 
                          field.onChange(value === "none" ? null : value)
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_supplier")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{t("no_supplier")}</SelectItem>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("notes")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Textarea
                          {...field}
                          placeholder={t("enter_notes")}
                          rows={3}
                          className="pl-9 pt-2"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {imageUrls.length > 0 && (
                <div className="space-y-2">
                  <Label>{t("images")}</Label>
                  <div className="border rounded-md p-3 bg-muted/30">
                    <ImagePreview
                      imageUrls={imageUrls}
                      alt={`${t("order_images")}`}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-2" />
                  {t("cancel")}
                </Button>
                
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : editOrder ? (
                    <Save className="w-4 h-4 mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {editOrder ? t("update") : t("save")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;
