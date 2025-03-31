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
  FileText,
  Image,
  MapPin,
  Percent,
  Receipt,
  Globe,
  Building,
  User
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
import ImageUpload from "@/components/orders/ImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConsumerForm } from "@/components/orders/ConsumerForm";

const orderFormSchema = z.object({
  orderNumber: z.string().min(1, { message: "Order number is required" }),
  orderDate: z.string().optional(),
  totalPrice: z.string().min(1, { message: "Total price is required" }),
  currency: z.string().default("EUR"),
  status: z.string().default("pending"),
  notes: z.string().optional(),
  supplierId: z.string().optional().nullable(),
  purchaseOrigin: z.string().optional().default("domestic"),
  supplierVatId: z.string().optional(),
  supplierCountry: z.string().optional(),
  vatAmount: z.string().optional(),
  vatRate: z.string().optional(),
  consumerId: z.string().optional().nullable(),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
  orderType: "fulfillment" | "supplier";
  editOrder?: any;
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

const PURCHASE_ORIGINS = [
  { value: "domestic", label: "Domestic (with VAT)" },
  { value: "eu_b2b", label: "EU B2B" },
  { value: "foreign_consumer", label: "Foreign / Consumer" }
];

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
  const [consumers, setConsumers] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingConsumers, setLoadingConsumers] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [ocrData, setOcrData] = useState<any>(null);
  const [isConsumerFormOpen, setIsConsumerFormOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const form = useForm<OrderFormValues>({
    defaultValues: {
      orderNumber: "",
      orderDate: format(new Date(), "yyyy-MM-dd"),
      totalPrice: "",
      currency: "EUR",
      status: "pending",
      notes: "",
      supplierId: null,
      purchaseOrigin: "domestic",
      supplierVatId: "",
      supplierCountry: "",
      vatAmount: "",
      vatRate: "",
      consumerId: null,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (orderType === "supplier") {
        fetchSuppliers();
      } else if (orderType === "fulfillment") {
        fetchConsumers();
      }
      
      if (!editOrder) {
        form.reset({
          orderNumber: "",
          orderDate: format(new Date(), "yyyy-MM-dd"),
          totalPrice: "",
          currency: "EUR",
          status: "pending",
          notes: "",
          supplierId: null,
          purchaseOrigin: "domestic",
          supplierVatId: "",
          supplierCountry: "",
          vatAmount: "",
          vatRate: "",
          consumerId: null,
        });
        setImageUrls([]);
        setOcrData(null);
        setOrderId(null);
      } else {
        form.reset({
          orderNumber: editOrder.order_number || "",
          orderDate: editOrder.order_date ? format(new Date(editOrder.order_date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
          totalPrice: editOrder.amount?.toString() || "",
          currency: editOrder.currency || "EUR",
          status: editOrder.status || "pending",
          notes: editOrder.notes && !editOrder.notes.startsWith('{') ? editOrder.notes : "",
          supplierId: editOrder.supplier_id || null,
          purchaseOrigin: editOrder.purchase_origin || "domestic",
          supplierVatId: editOrder.supplier_vat_id || "",
          supplierCountry: editOrder.supplier_country || "",
          vatAmount: editOrder.vat_amount ? editOrder.vat_amount.toString() : "",
          vatRate: editOrder.vat_rate ? editOrder.vat_rate.toString() : "",
          consumerId: editOrder.consumer_id || null,
        });

        setOrderId(editOrder.id);

        if (editOrder.ocr_customer_data) {
          setOcrData(editOrder.ocr_customer_data);
        } else {
          setOcrData(null);
        }

        if (editOrder.image_url) {
          setImageUrls([editOrder.image_url]);
        } else {
          setImageUrls([]);
        }

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

  const fetchConsumers = async () => {
    if (!user) return;
    
    setLoadingConsumers(true);
    const { data, error } = await supabase
      .from("consumers")
      .select("id, full_name, email, postal_code")
      .eq("user_id", user.id);
      
    setLoadingConsumers(false);
    
    if (error) {
      console.error("Error fetching consumers:", error);
      toast({
        title: t("error"),
        description: t("error_fetching_consumers"),
        variant: "destructive",
      });
      return;
    }
    
    setConsumers(data || []);
  };

  const handleImageUpload = (urls: string[]) => {
    setImageUrls(urls);
  };

  const onSubmit = async (values: OrderFormValues) => {
    if (!user) return;

    setIsSaving(true);

    try {
      const now = new Date().toISOString();
      const orderDate = values.orderDate || format(new Date(), "yyyy-MM-dd");
      
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
        consumer_id: orderType === "fulfillment" ? values.consumerId : null,
        created_at: editOrder ? undefined : now,
        updated_at: now,
        order_date: orderDate,
        image_url: imageUrls.length > 0 ? imageUrls[0] : null,
        ...(orderType === "supplier" && {
          purchase_origin: values.purchaseOrigin,
          supplier_vat_id: values.supplierVatId || null,
          supplier_country: values.supplierCountry || null,
          vat_amount: values.vatAmount ? parseFloat(values.vatAmount) : null,
          vat_rate: values.vatRate ? parseFloat(values.vatRate) : null,
        }),
      };

      let error;
      let newOrderId;
      
      if (editOrder) {
        const { error: updateError } = await supabase
          .from("orders")
          .update(orderData)
          .eq("id", editOrder.id);
        error = updateError;
        newOrderId = editOrder.id;
      } else {
        const { data, error: insertError } = await supabase
          .from("orders")
          .insert(orderData)
          .select("id")
          .single();
        error = insertError;
        newOrderId = data?.id;
        
        if (data) {
          setOrderId(data.id);
        }
      }

      if (error) throw error;

      onOrderCreated();
      
      if (!editOrder && imageUrls.length > 0) {
        toast({
          title: t("order_created"),
          description: t("order_created_successfully"),
        });
      } else {
        onClose();
        
        toast({
          title: editOrder ? t("order_updated") : t("order_created"),
          description: editOrder ? t("order_updated_successfully") : t("order_created_successfully"),
        });
      }
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

  const handleConsumerCreated = (consumerId: string) => {
    form.setValue("consumerId", consumerId);
    
    fetchConsumers();
    
    setIsConsumerFormOpen(false);
    
    toast({
      title: t("consumer_added"),
      description: t("consumer_added_successfully"),
    });
  };

  const formatOcrData = (data: any) => {
    if (!data) return null;
    
    const fields = [
      { key: 'name', label: 'Name' },
      { key: 'address', label: 'Address' },
      { key: 'tax_id', label: 'Tax ID' },
      { key: 'vat_id', label: 'VAT ID' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
    ];
    
    return fields.map(field => {
      if (data[field.key]) {
        return { label: field.label, value: data[field.key] };
      }
      return null;
    }).filter(Boolean);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <ScrollArea className="max-h-[80vh] pr-4">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">
              {editOrder ? t("edit_order") : t("add_order")}
              {orderType && (
                <Badge className="ml-2">{orderType === "fulfillment" ? t("fulfillment") : t("supplier")}</Badge>
              )}
            </h2>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">{t("order_information")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                    <FormField
  control={form.control}
  name="order_type"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t("order_type")}</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <SelectTrigger>
          <SelectValue placeholder={t("select_order_type")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fulfillment">{t("order_type_fulfillment")}</SelectItem>
          <SelectItem value="supplier">{t("order_type_supplier")}</SelectItem>
          <SelectItem value="search-request">{t("order_type_search_request")}</SelectItem>
        </SelectContent>
      </Select>
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
                  </CardContent>
                </Card>

                {orderType === "fulfillment" && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        {t("customer_information")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="consumerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("customer")}</FormLabel>
                            <div className="flex space-x-2">
                              <div className="flex-1">
                                <Select
                                  value={field.value || "none"}
                                  onValueChange={(value) => 
                                    field.onChange(value === "none" ? null : value)
                                  }
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={t("select_customer")} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">{t("no_customer")}</SelectItem>
                                    {consumers.map((consumer) => (
                                      <SelectItem key={consumer.id} value={consumer.id}>
                                        {consumer.full_name || consumer.email || consumer.postal_code}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button 
                                type="button" 
                                size="sm"
                                onClick={() => setIsConsumerFormOpen(true)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                {t("new")}
                              </Button>
                            </div>
                            {loadingConsumers && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                {t("loading_customers")}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {orderType === "supplier" && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md flex items-center">
                        <Receipt className="h-4 w-4 mr-2" />
                        {t("purchase_details")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="purchaseOrigin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("purchase_origin")}</FormLabel>
                            <Select
                              value={field.value || "domestic"}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger className="pl-9">
                                  <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <SelectValue placeholder={t("select_purchase_origin")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {PURCHASE_ORIGINS.map((origin) => (
                                  <SelectItem key={origin.value} value={origin.value}>
                                    {origin.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="supplierVatId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("supplier_vat_id")}</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    {...field}
                                    placeholder={t("supplier_vat_id_placeholder")}
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
                          name="supplierCountry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("supplier_country")}</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    {...field}
                                    placeholder={t("supplier_country_placeholder")}
                                    className="pl-9"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="vatAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("vat_amount")}</FormLabel>
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
                          name="vatRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("vat_rate")}</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center">
                          <Image className="h-4 w-4 mr-2" />
                          {t("invoice_images")}
                        </Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          {t("upload_invoice_for_ocr")}
                        </p>
                        
                        {(editOrder || orderId) ? (
                          <div className="space-y-2">
                            {imageUrls.length > 0 && (
                              <div className="border rounded-md p-3 bg-muted/30">
                                <ImagePreview
                                  imageUrls={imageUrls}
                                  alt={`${t("order_images")}`}
                                />
                              </div>
                            )}
                            
                            <div className="border rounded-md p-3">
                              <ImageUpload
                                id={orderId || editOrder?.id}
                                table="orders"
                                storagePath={`order-${orderId || editOrder?.id}`}
                                field="image_url"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="border rounded-md p-3 bg-muted/30 text-sm text-muted-foreground">
                            {t("save_order_first_to_upload")}
                          </div>
                        )}
                      </div>

                      {ocrData && (
                        <div className="space-y-2">
                          <Label>{t("parsed_invoice_data")}</Label>
                          <div className="border rounded-md p-4 bg-muted/30">
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                              {formatOcrData(ocrData)?.map((item, index) => (
                                <div key={index} className="col-span-1">
                                  <dt className="text-sm font-medium text-muted-foreground">{item.label}</dt>
                                  <dd className="text-sm">{item.value}</dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      {t("notes")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={t("enter_notes")}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

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
        </ScrollArea>
      </DialogContent>
      
      <ConsumerForm 
        isOpen={isConsumerFormOpen}
        onClose={() => setIsConsumerFormOpen(false)}
        onConsumerCreated={handleConsumerCreated}
      />
    </Dialog>
  );
};

export default OrderForm;
