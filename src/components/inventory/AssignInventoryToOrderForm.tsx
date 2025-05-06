
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Order } from "@/types/order";
import { InventoryItem } from "@/types/inventory";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, Info } from "lucide-react";

interface AssignInventoryToOrderFormProps {
  onOrderSelected: (order: Order | null) => void;
  selectedOrder: Order | null;
}

type FormValues = {
  orderId: string;
  itemAssignments: Record<string, { 
    quantity: number;
    itemId: string;
  }>;
};

export const AssignInventoryToOrderForm = ({
  onOrderSelected,
  selectedOrder,
}: AssignInventoryToOrderFormProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  const form = useForm<FormValues>({
    defaultValues: {
      orderId: "",
      itemAssignments: {},
    },
  });

  // Fetch sales orders
  useEffect(() => {
    if (!user) return;
    
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .eq("order_type", "fulfillment")
          .is("is_sales_order", true)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setOrders(data as Order[]);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast({
          title: t("error"),
          description: t("error_fetching_orders"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [user, toast, t]);

  // Fetch inventory items when an order is selected
  useEffect(() => {
    if (!selectedOrder) {
      setInventoryItems([]);
      return;
    }

    const fetchInventoryItems = async () => {
      setLoading(true);
      try {
        // Fetch open inventory items
        const { data, error } = await supabase
          .from("ocr_invoice_items")
          .select(`
            id, 
            description, 
            quantity, 
            unit_price, 
            total_price,
            tax_rate,
            mapping_id,
            mapping:ocr_invoice_mappings(
              invoice_date, 
              supplier_name
            )
          `)
          .order("id", { ascending: false });
        
        if (error) throw error;
        
        // Format data and filter out items with no quantity
        const items = (data || []).map(item => ({
          id: item.id,
          description: item.description || t("unknown_item"),
          quantity: item.quantity || 0,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
          tax_rate: item.tax_rate || 0,
          invoice_date: item.mapping?.[0]?.invoice_date || null,
          supplier_name: item.mapping?.[0]?.supplier_name || t("unknown_supplier"),
          mapping_id: item.mapping_id,
        })).filter(item => item.quantity > 0);
        
        setInventoryItems(items);
      } catch (error) {
        console.error("Error fetching inventory items:", error);
        toast({
          title: t("error"),
          description: t("error_fetching_inventory"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchInventoryItems();
  }, [selectedOrder, toast, t]);

  const onOrderChange = (orderId: string) => {
    const selected = orders.find(o => o.id === orderId) || null;
    onOrderSelected(selected);
    form.setValue("orderId", orderId);
    // Reset selected items when changing orders
    setSelectedItems({});
  };

  const handleQuantityChange = (itemId: string, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    const item = inventoryItems.find(i => i.id === itemId);
    
    if (item && numValue >= 0 && numValue <= item.quantity) {
      setSelectedItems({
        ...selectedItems,
        [itemId]: numValue
      });
    }
  };

  const handleAssignItems = async () => {
    if (!selectedOrder || !user) return;
    
    const itemsToAssign = Object.entries(selectedItems)
      .filter(([_, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => ({
        itemId,
        quantity
      }));
    
    if (itemsToAssign.length === 0) {
      toast({
        title: t("warning"),
        description: t("no_items_selected"),
      });
      return;
    }
    
    setAssigning(true);
    try {
      for (const { itemId, quantity } of itemsToAssign) {
        // Using raw SQL method since the table isn't in the types
        const { error } = await supabase
          .rpc('insert_order_inventory_item' as any, { 
            p_order_id: selectedOrder.id,
            p_ocr_item_id: itemId,
            p_assigned_quantity: quantity,
            p_created_by: user.id
          });
        
        if (error) throw error;
      }
      
      toast({
        title: t("success"),
        description: t("items_assigned_successfully"),
      });
      
      // Reset selected items after successful assignment
      setSelectedItems({});
      
      // Refresh inventory items to reflect new quantities
      if (selectedOrder) {
        const selectedOrderId = selectedOrder.id;
        onOrderSelected(null);
        setTimeout(() => {
          const reselectedOrder = orders.find(o => o.id === selectedOrderId) || null;
          onOrderSelected(reselectedOrder);
        }, 100);
      }
    } catch (error) {
      console.error("Error assigning items:", error);
      toast({
        title: t("error"),
        description: t("error_assigning_items"),
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  // Get total items and value selected
  const totalItemsSelected = Object.values(selectedItems).reduce((sum, qty) => sum + qty, 0);
  const totalValueSelected = inventoryItems
    .filter(item => selectedItems[item.id] > 0)
    .reduce((sum, item) => sum + (item.unit_price * (selectedItems[item.id] || 0)), 0);

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form className="space-y-4">
          <FormField
            control={form.control}
            name="orderId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("assign_inventory.select_order")}</FormLabel>
                <Select
                  disabled={loading}
                  value={field.value}
                  onValueChange={onOrderChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("assign_inventory.select_order_placeholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.order_number} ({new Date(order.order_date).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      {selectedOrder && (
        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">{t("order_details")}</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>{t("order_number")}:</div>
              <div className="font-medium">{selectedOrder.order_number}</div>
              <div>{t("order_date")}:</div>
              <div className="font-medium">{new Date(selectedOrder.order_date).toLocaleDateString()}</div>
              <div>{t("amount")}:</div>
              <div className="font-medium">
                {new Intl.NumberFormat(undefined, {
                  style: 'currency',
                  currency: selectedOrder.currency || 'EUR'
                }).format(selectedOrder.amount)}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">{t("assign_inventory.available_items")}</h3>
            
            {inventoryItems.length > 0 ? (
              <>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("description")}</TableHead>
                        <TableHead>{t("supplier")}</TableHead>
                        <TableHead>{t("invoice_date")}</TableHead>
                        <TableHead className="text-right">{t("unit_price")}</TableHead>
                        <TableHead className="text-right">{t("available")}</TableHead>
                        <TableHead className="text-right">{t("assign_quantity")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell>{item.supplier_name}</TableCell>
                          <TableCell>
                            {item.invoice_date 
                              ? new Date(item.invoice_date).toLocaleDateString() 
                              : t("unknown")}
                          </TableCell>
                          <TableCell className="text-right">
                            {new Intl.NumberFormat(undefined, {
                              style: 'currency',
                              currency: selectedOrder.currency || 'EUR'
                            }).format(item.unit_price)}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={selectedItems[item.id] || ""}
                              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                              className="max-w-[100px] ml-auto"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="text-sm">
                    <p>
                      <span className="font-medium">{totalItemsSelected}</span> {t("items_selected")}, {t("total_value")}: 
                      <span className="font-medium ml-1">
                        {new Intl.NumberFormat(undefined, {
                          style: 'currency',
                          currency: selectedOrder.currency || 'EUR'
                        }).format(totalValueSelected)}
                      </span>
                    </p>
                  </div>
                  <Button 
                    onClick={handleAssignItems} 
                    disabled={assigning || totalItemsSelected === 0}
                    className="shrink-0"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {t("assign_inventory.assign_button")}
                  </Button>
                </div>
              </>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {loading 
                    ? t("loading_inventory_items") 
                    : t("no_inventory_items_available")}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
