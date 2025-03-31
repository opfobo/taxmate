
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
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

interface FormValues {
  invoice_number: string;
  invoice_date: string;
  supplier_name: string;
  supplier_address: string;
  supplier_vat: string;
  customer_name: string;
  customer_address: string;
  total_amount: string;
  total_tax: string;
  total_net: string;
  currency: string;
}

export const OcrInvoiceReview = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceMapping | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const form = useForm<FormValues>({
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
          setInvoiceData(data);
          setLineItems(data.line_items || []);
          
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
  const onSubmit = async (values: FormValues) => {
    if (!invoiceData?.id || !user) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from("ocr_invoice_mappings")
        .update({
          invoice_number: values.invoice_number,
          invoice_date: values.invoice_date ? new Date(values.invoice_date) : null,
          supplier_name: values.supplier_name,
          supplier_address: values.supplier_address,
          supplier_vat: values.supplier_vat,
          customer_name: values.customer_name,
          customer_address: values.customer_address,
          total_amount: parseFloat(values.total_amount) || 0,
          total_tax: parseFloat(values.total_tax) || 0,
          total_net: parseFloat(values.total_net) || 0,
          currency: values.currency,
          line_items: lineItems
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

  // Confirm invoice and create order
  const confirmInvoice = async () => {
    if (!invoiceData?.id || !user) return;
    
    try {
      setConfirming(true);
      
      // Save current data first
      await onSubmit(form.getValues());
      
      // Update status to confirmed
      const { error } = await supabase
        .from("ocr_invoice_mappings")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString()
        })
        .eq("id", invoiceData.id)
        .eq("user_id", user.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Invoice confirmed successfully. Order will be created."
      });
      
      // Navigate to orders page (to be implemented)
      navigate("/dashboard/orders/purchases");
    } catch (error) {
      console.error("Error confirming invoice:", error);
      toast({
        title: "Error",
        description: "Failed to confirm invoice",
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
            onClick={form.handleSubmit(onSubmit)} 
            disabled={saving || confirming}
          >
            {saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
          <Button 
            onClick={confirmInvoice}
            disabled={saving || confirming}
            variant="default"
          >
            {confirming ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck className="mr-2 h-4 w-4" />}
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
                              onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                              placeholder="Item description"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input 
                              value={item.quantity} 
                              onChange={(e) => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                              type="number"
                              min="1"
                              step="1"
                              className="w-16 text-right ml-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input 
                              value={item.unit_price} 
                              onChange={(e) => updateLineItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
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
                {lineItems.length} item{lineItems.length !== 1 ? "s" : ""} total
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total:</p>
                <p className="text-lg font-medium">
                  {form.getValues().currency} {parseFloat(form.getValues().total_amount).toFixed(2)}
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
