
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceFormSchema, InvoiceFormValues } from "@/lib/validators/invoice-validator";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel 
} from "@/components/ui/form";
import { LoaderCircle, Save, PlusCircle, Trash2, FileCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Type definitions
interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

interface InvoiceMapping {
  id: string;
  user_id: string;
  ocr_request_id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  supplier_name: string | null;
  supplier_address: string | null;
  supplier_vat: string | null;
  customer_name: string | null;
  customer_address: string | null;
  total_amount: number | null;
  total_tax: number | null;
  total_net: number | null;
  currency: string;
  line_items: LineItem[];
  status: string;
  created_at: string;
  confirmed_at: string | null;
}

const OcrInvoiceReview = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceMapping | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  console.log("OCR Review Debug", {
    requestId,
    currentUserId: user?.id,
  });

  console.log("OCR Review Params →", { requestId, user });

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoice_number: "",
      invoice_date: "",
      supplier_name: "",
      supplier_address: "",
      supplier_vat: "",
      customer_name: "",
      customer_address: "",
      total_amount: "0",
      total_tax: "0",
      total_net: "0",
      currency: "EUR"
    }
  });
  
  const currency = form.watch("currency");
  const totalAmount = form.watch("total_amount");

  // Fetch invoice data
  useEffect(() => {
    if (!requestId || !user) return;

    const fetchInvoiceData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("ocr_invoice_mappings")
          .select("*")
          .eq("ocr_request_id", requestId)
          .eq("user_id", user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          // Convert line_items from JSON to LineItem[] type
          const typedLineItems = Array.isArray(data.line_items) 
            ? data.line_items.map((item: any): LineItem => ({
                id: item.id || crypto.randomUUID(),
                description: item.description || "",
                quantity: Number(item.quantity) || 0,
                unit_price: Number(item.unit_price) || 0,
                total_amount: Number(item.total_amount) || 0
              }))
            : [];
          
          // Create a properly typed invoice mapping
          const typedInvoiceData: InvoiceMapping = {
            id: data.id,
            user_id: data.user_id,
            ocr_request_id: data.ocr_request_id,
            invoice_number: data.invoice_number,
            invoice_date: data.invoice_date,
            supplier_name: data.supplier_name,
            supplier_address: data.supplier_address,
            supplier_vat: data.supplier_vat,
            customer_name: data.customer_name,
            customer_address: data.customer_address,
            total_amount: data.total_amount,
            total_tax: data.total_tax,
            total_net: data.total_net,
            currency: data.currency || "EUR",
            line_items: typedLineItems,
            status: data.status,
            created_at: data.created_at,
            confirmed_at: data.confirmed_at
          };
          
          setInvoiceData(typedInvoiceData);
          setLineItems(typedLineItems);
          
          // Populate form with data
          form.reset({
            invoice_number: data.invoice_number || "",
            invoice_date: data.invoice_date ? new Date(data.invoice_date).toISOString().split('T')[0] : "",
            supplier_name: data.supplier_name || "",
            supplier_address: data.supplier_address || "",
            supplier_vat: data.supplier_vat || "",
            customer_name: data.customer_name || "",
            customer_address: data.customer_address || "",
            total_amount: data.total_amount?.toString() || "0",
            total_tax: data.total_tax?.toString() || "0",
            total_net: data.total_net?.toString() || "0",
            currency: data.currency || "EUR"
          });
        }
      } catch (error) {
        console.error("Error fetching invoice data:", error);
        toast({
          title: "Error",
          description: "Failed to load invoice data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [requestId, user, form]);

  // Handle form submission
  const onSubmit = async (values: InvoiceFormValues) => {
    if (!invoiceData?.id || !user) return;
    
    try {
      setSaving(true);
      
      // Convert lineItems to a format compatible with Json type
      const lineItemsForStorage = lineItems.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.total_amount
      }));
      
      const { error } = await supabase
        .from("ocr_invoice_mappings")
        .update({
          invoice_number: values.invoice_number,
          invoice_date: values.invoice_date,
          supplier_name: values.supplier_name,
          supplier_address: values.supplier_address,
          supplier_vat: values.supplier_vat,
          customer_name: values.customer_name,
          customer_address: values.customer_address,
          total_amount: parseFloat(values.total_amount) || 0,
          total_tax: parseFloat(values.total_tax) || 0,
          total_net: parseFloat(values.total_net) || 0,
          currency: values.currency,
          line_items: lineItemsForStorage
        })
        .eq("id", invoiceData.id)
        .eq("user_id", user.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Invoice data saved successfully"
      });
    } catch (error) {
      console.error("Error saving invoice data:", error);
      toast({
        title: "Error",
        description: "Failed to save invoice data",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Add new line item
  const addLineItem = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      unit_price: 0,
      total_amount: 0
    };
    
    setLineItems([...lineItems, newItem]);
  };

  // Update line item
  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(items => 
      items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Recalculate total if quantity or unit price changes
          if (field === "quantity" || field === "unit_price") {
            updatedItem.total_amount = updatedItem.quantity * updatedItem.unit_price;
          }
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Remove line item
  const removeLineItem = (id: string) => {
    setLineItems(items => items.filter(item => item.id !== id));
  };

  // Calculate totals from line items
  useEffect(() => {
    if (lineItems.length > 0) {
      const totalAmount = lineItems.reduce((sum, item) => sum + (item.total_amount || 0), 0);
      form.setValue("total_amount", totalAmount.toString());
    }
  }, [lineItems, form]);

  // Create a sales order from the OCR invoice mapping
  const createSalesOrder = async (mappingId: string, formValues: InvoiceFormValues) => {
    try {
      // Prepare line items for storage in a format compatible with the orders table
      const orderLineItems = lineItems.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.total_amount
      }));

      // Create a new sales order
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id,
          is_sales_order: true, // This marks it as a sales order
          type: "sale", // Set order type to 'sale'
          order_date: formValues.invoice_date || new Date().toISOString().split('T')[0],
          amount: parseFloat(formValues.total_amount) || 0,
          status: "pending",
          order_number: formValues.invoice_number || `SO-${Date.now()}`,
          currency: formValues.currency || "EUR",
          supplier_name: formValues.supplier_name,
          ocr_customer_data: {
            customer_name: formValues.customer_name,
            customer_address: formValues.customer_address
          },
          line_items: orderLineItems,
          source_order_id: mappingId // Reference to the original OCR mapping
        })
        .select("id")
        .single();

      if (error) throw error;
      
      return order;
    } catch (error) {
      console.error("Error creating sales order:", error);
      throw error;
    }
  };

  // Confirm invoice and create order
  const confirmInvoice = async () => {
    if (!invoiceData?.id || !user) return;
    
    try {
      setConfirming(true);
      
      // Save current data first
      await onSubmit(form.getValues());
      
      // Update status to confirmed
      const { error: updateError } = await supabase
        .from("ocr_invoice_mappings")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString()
        })
        .eq("id", invoiceData.id)
        .eq("user_id", user.id);

      if (updateError) throw updateError;
      
      // Create a sales order based on the confirmed mapping
      const formValues = form.getValues();
      const order = await createSalesOrder(invoiceData.id, formValues);
      
      toast({
        title: "Success",
        description: "Invoice confirmed and sales order created successfully."
      });
      
      // Navigate to the new order's detail page
      if (order && order.id) {
        navigate(`/dashboard/orders/${order.id}`);
      } else {
        // Fallback to orders page if we can't get the specific order ID
        navigate("/dashboard/orders/sales");
      }
    } catch (error) {
      console.error("Error confirming invoice:", error);
      toast({
        title: "Error",
        description: "Failed to confirm invoice or create sales order",
        variant: "destructive"
      });
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading invoice data...</span>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <h2 className="text-xl font-semibold mb-2">Invoice Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The requested invoice could not be found or you don't have permission to view it.
        </p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Review Invoice Data</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            disabled={saving || confirming}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={form.handleSubmit(onSubmit)} 
            disabled={saving || confirming || !form.formState.isDirty}
          >
            {saving ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
          <Button 
            type="button"
            onClick={confirmInvoice}
            disabled={saving || confirming || !form.formState.isValid}
            variant="default"
          >
            {confirming ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileCheck className="mr-2 h-4 w-4" />
            )}
            Confirm & Create Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Information</CardTitle>
                <CardDescription>Review and edit the invoice details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoice_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="invoice_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Supplier Details</CardTitle>
                <CardDescription>Information about the supplier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="supplier_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supplier_vat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VAT ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supplier_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
                <CardDescription>Information about the customer (you)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customer_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </form>
        </Form>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Totals</CardTitle>
              <CardDescription>Invoice amounts and currency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="total_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="total_net"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Net Amount</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="total_tax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Amount</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Line Items</CardTitle>
                <CardDescription>Products or services on this invoice</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addLineItem}
                className="h-8"
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </CardHeader>

            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {lineItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                          No items found. Click "Add Item" to add an invoice line.
                        </TableCell>
                      </TableRow>
                    ) : (
                      lineItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Input 
                              value={item.description} 
                              onChange={(e) =>
                                updateLineItem(item.id, "description", e.target.value)
                              }
                              placeholder="Item description"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input 
                              value={item.quantity}
                              onChange={(e) =>
                                updateLineItem(
                                  item.id,
                                  "quantity",
                                  isNaN(Number(e.target.value)) ? 0 : parseFloat(e.target.value)
                                )
                              }
                              type="number"
                              min="0"
                              step="1"
                              className="w-16 text-right ml-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input 
                              value={item.unit_price}
                              onChange={(e) =>
                                updateLineItem(
                                  item.id,
                                  "unit_price",
                                  isNaN(Number(e.target.value)) ? 0 : parseFloat(e.target.value)
                                )
                              }
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-24 text-right ml-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {(item.total_amount || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLineItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {lineItems.length} item{lineItems.length !== 1 ? "s" : ""}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total:</p>
                <p className="text-lg font-medium">
                  {currency} {parseFloat(totalAmount || "0").toFixed(2)}
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OcrInvoiceReview;
