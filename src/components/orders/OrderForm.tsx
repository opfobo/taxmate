import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { OrderType } from "@/types/order";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceFormValues } from "@/lib/validators/invoice-validator";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";
import { useInvoiceForm } from "@/components/invoice/use-invoice-form";

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
  orderType: OrderType;
  editOrder?: any | null;
}

const OrderForm: React.FC<OrderFormProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  orderType,
  editOrder
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState("pending");
  const [totalPrice, setTotalPrice] = useState("");
  const [supplierId, setSupplierId] = useState<string | undefined>(undefined);
  const [purchaseOrigin, setPurchaseOrigin] = useState("");
  const [supplierVatId, setSupplierVatId] = useState("");
  const [supplierCountry, setSupplierCountry] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [vatRate, setVatRate] = useState("");
  const [notes, setNotes] = useState("");
  const [consumerId, setConsumerId] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState("EUR");
  const [orderTypeValue, setOrderTypeValue] = useState<OrderType>(orderType);

  const {
    formValues,
    setFormValues,
    handleInputChange,
    resetForm,
  } = useInvoiceForm();

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("user_id", user?.id || "")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching suppliers:", error);
        toast({
          title: t("error"),
          description: t("error_fetching_suppliers"),
          variant: "destructive",
        });
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!user,
  });

  const { data: consumers = [] } = useQuery({
    queryKey: ["consumers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consumers")
        .select("*")
        .eq("user_id", user?.id || "")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Error fetching consumers:", error);
        toast({
          title: t("error"),
          description: t("error_fetching_consumers"),
          variant: "destructive",
        });
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (editOrder) {
      setOrderNumber(editOrder.order_number || "");
      setOrderDate(editOrder.order_date ? new Date(editOrder.order_date) : undefined);
      setStatus(editOrder.status || "pending");
      setTotalPrice(editOrder.amount?.toString() || "");
      setSupplierId(editOrder.supplier?.id || undefined);
      setPurchaseOrigin(editOrder.purchase_origin || "");
      setSupplierVatId(editOrder.supplier_vat_id || "");
      setSupplierCountry(editOrder.supplier_country || "");
      setVatAmount(editOrder.vat_amount?.toString() || "");
      setVatRate(editOrder.vat_rate?.toString() || "");
      setNotes(editOrder.notes || "");
      setConsumerId(editOrder.consumer_id || undefined);
      setCurrency(editOrder.currency || "EUR");
      setOrderTypeValue(editOrder.order_type || orderType);

      // Set invoice form values if available
      if (editOrder.ocr_customer_data) {
        setFormValues((prevValues: InvoiceFormValues) => ({
          ...prevValues,
          invoice_number: editOrder.ocr_customer_data?.invoice_number || '',
          invoice_date: editOrder.ocr_customer_data?.invoice_date || '',
          supplier_name: editOrder.ocr_customer_data?.supplier_name || '',
          supplier_address: editOrder.ocr_customer_data?.supplier_address || '',
          supplier_vat: editOrder.ocr_customer_data?.supplier_vat || '',
          customer_name: editOrder.ocr_customer_data?.customer_name || '',
          customer_address: editOrder.ocr_customer_data?.customer_address || '',
          total_amount: editOrder.ocr_customer_data?.total_amount || '',
          total_tax: editOrder.ocr_customer_data?.total_tax || '',
          total_net: editOrder.ocr_customer_data?.total_net || '',
          currency: editOrder.ocr_customer_data?.currency || 'EUR',
        }));
      }
    } else {
      // Reset form values when creating a new order
      setOrderNumber("");
      setOrderDate(undefined);
      setStatus("pending");
      setTotalPrice("");
      setSupplierId(undefined);
      setPurchaseOrigin("");
      setSupplierVatId("");
      setSupplierCountry("");
      setVatAmount("");
      setVatRate("");
      setNotes("");
      setConsumerId(undefined);
      setCurrency("EUR");
      setOrderTypeValue(orderType);
      resetForm();
    }
  }, [editOrder, orderType, resetForm, setFormValues]);

  const handleSubmit = async () => {
    if (!totalPrice) {
      toast({
        title: t("error"),
        description: t("total_price_required"),
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(totalPrice);
    if (isNaN(amount)) {
      toast({
        title: t("error"),
        description: t("invalid_total_price"),
        variant: "destructive",
      });
      return;
    }

    try {
      const ocrCustomerData = {
        ...formValues,
      };

      if (editOrder) {
        const { error } = await supabase
          .from("orders")
          .update({
            order_number: orderNumber,
            order_date: orderDate?.toISOString(),
            status: status,
            amount: amount,
            supplier_id: supplierId,
            purchase_origin: purchaseOrigin,
            supplier_vat_id: supplierVatId,
            supplier_country: supplierCountry,
            vat_amount: parseFloat(vatAmount || "0"),
            vat_rate: parseFloat(vatRate || "0"),
            notes: notes,
            consumer_id: consumerId,
            currency: currency,
            type: orderType,
            order_type: orderTypeValue,
            ocr_customer_data: ocrCustomerData,
          })
          .eq("id", editOrder.id);

        if (error) {
          console.error("Error updating order:", error);
          toast({
            title: t("error"),
            description: t("error_updating_order"),
            variant: "destructive",
          });
          return;
        }

        toast({
          title: t("success"),
          description: t("order_updated_successfully"),
        });
      } else {
        const { error } = await supabase
          .from("orders")
          .insert({
            id: uuidv4(),
            user_id: user?.id,
            order_number: orderNumber,
            order_date: orderDate?.toISOString(),
            status: status,
            amount: amount,
            supplier_id: supplierId,
            purchase_origin: purchaseOrigin,
            supplier_vat_id: supplierVatId,
            supplier_country: supplierCountry,
            vat_amount: parseFloat(vatAmount || "0"),
            vat_rate: parseFloat(vatRate || "0"),
            notes: notes,
            consumer_id: consumerId,
            currency: currency,
            type: orderType,
            order_type: orderTypeValue,
            ocr_customer_data: ocrCustomerData,
          });

        if (error) {
          console.error("Error creating order:", error);
          toast({
            title: t("error"),
            description: t("error_creating_order"),
            variant: "destructive",
          });
          return;
        }

        toast({
          title: t("success"),
          description: t("order_created_successfully"),
        });
      }

      onOrderCreated();
      onClose();
    } catch (error: any) {
      console.error("Error during order submission:", error);
      toast({
        title: t("error"),
        description: error.message || t("unknown_error"),
        variant: "destructive",
      });
    }
  };

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{editOrder ? t("edit_order") : t("add_order")}</DialogTitle>
          <DialogDescription>
            {t("enter_order_details")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="orderNumber">{t("order_number")}</Label>
              <Input
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="orderDate">{t("order_date")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !orderDate && "text-muted-foreground"
                    )}
                  >
                    {orderDate ? format(orderDate, "PPP") : <span>{t("pick_date")}</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={orderDate}
                    onSelect={setOrderDate}
                    disabled={(date) =>
                      date > new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">{t("status")}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("select_status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t("pending")}</SelectItem>
                  <SelectItem value="processing">{t("processing")}</SelectItem>
                  <SelectItem value="shipped">{t("shipped")}</SelectItem>
                  <SelectItem value="delivered">{t("delivered")}</SelectItem>
                  <SelectItem value="canceled">{t("canceled")}</SelectItem>
                  <SelectItem value="accepted">{t("accepted")}</SelectItem>
                  <SelectItem value="declined">{t("declined")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="totalPrice">{t("total_price")}</Label>
              <Input
                id="totalPrice"
                type="number"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency">{t("currency")}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("select_currency")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="orderType">{t("order_type")}</Label>
              <Select value={orderTypeValue} onValueChange={(value) => setOrderTypeValue(value as OrderType)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("select_order_type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fulfillment">{t("fulfillment")}</SelectItem>
                  <SelectItem value="supplier">{t("supplier")}</SelectItem>
                  <SelectItem value="search-request">{t("search_request")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {orderType === "supplier" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplierId">{t("supplier")}</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger className="w-full">
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
              </div>

              <div>
                <Label htmlFor="purchaseOrigin">{t("purchase_origin")}</Label>
                <Input
                  id="purchaseOrigin"
                  value={purchaseOrigin}
                  onChange={(e) => setPurchaseOrigin(e.target.value)}
                />
              </div>
            </div>
          )}

          {orderType === "supplier" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplierVatId">{t("supplier_vat_id")}</Label>
                <Input
                  id="supplierVatId"
                  value={supplierVatId}
                  onChange={(e) => setSupplierVatId(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="supplierCountry">{t("supplier_country")}</Label>
                <Input
                  id="supplierCountry"
                  value={supplierCountry}
                  onChange={(e) => setSupplierCountry(e.target.value)}
                />
              </div>
            </div>
          )}

          {orderType === "fulfillment" && (
            <div>
              <Label htmlFor="consumerId">{t("consumer")}</Label>
              <Select value={consumerId} onValueChange={setConsumerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("select_consumer")} />
                </SelectTrigger>
                <SelectContent>
                  {consumers.map((consumer) => (
                    <SelectItem key={consumer.id} value={consumer.id}>
                      {consumer.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vatAmount">{t("vat_amount")}</Label>
              <Input
                id="vatAmount"
                type="number"
                value={vatAmount}
                onChange={(e) => setVatAmount(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="vatRate">{t("vat_rate")}</Label>
              <Input
                id="vatRate"
                type="number"
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <InvoiceForm
              formValues={formValues}
              setFormValues={setFormValues}
              handleInputChange={handleInputChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            {editOrder ? t("update") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;
