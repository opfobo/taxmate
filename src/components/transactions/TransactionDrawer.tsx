import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Order } from "@/pages/TransactionsPage";
import { Crosshair, Link, Plus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";

const transactionSchema = z.object({
  amount: z.coerce.number()
    .gt(0, { message: "Amount must be greater than 0" }),
  currency: z.string()
    .min(1, { message: "Currency is required" }),
  type: z.enum(["purchase", "refund", "payout"]),
  status: z.enum(["success", "pending", "failed", "unmatched", "matched"]),
  payment_method: z.string()
    .min(1, { message: "Payment method is required" }),
  order_id: z.string()
    .nullable()
    .optional(),
  notes: z.string()
    .optional(),
  linked_order_ids: z.string()
    .array()
    .optional(),
});

interface TransactionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: any;
  orders: Order[];
  onSubmit: (data: z.infer<typeof transactionSchema>, isEditing: boolean) => Promise<void>;
}

const TransactionDrawer = ({
  open,
  onOpenChange,
  transaction,
  orders,
  onSubmit,
}: TransactionDrawerProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isMultiOrderLinkingOpen, setIsMultiOrderLinkingOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: transaction?.amount || 0,
      currency: transaction?.currency || "EUR",
      type: transaction?.type ?? "purchase",
      status: transaction?.status || "unmatched",
      payment_method: transaction?.payment_method || "",
      order_id: transaction?.order_id || null,
      notes: transaction?.notes || "",
      linked_order_ids: transaction?.linked_order_ids || [],
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (transaction) {
      form.reset({
        amount: transaction.amount || 0,
        currency: transaction.currency || "EUR",
        type: transaction.type || "purchase",
        status: transaction.status || "unmatched",
        payment_method: transaction.payment_method || "",
        order_id: transaction.order_id || null,
        notes: transaction.notes || "",
        linked_order_ids: transaction.linked_order_ids || [],
      });
      
      if (transaction.matched_orders) {
        setSelectedOrders(transaction.matched_orders);
      } else {
        setSelectedOrders([]);
      }
    } else {
      setSelectedOrders([]);
    }
  }, [transaction, form]);

  const handleFormSubmit = async (values: z.infer<typeof transactionSchema>) => {
    try {
      const linkedOrderIds = selectedOrders.map((order) => order.id);
      
      const valuesWithLinkedOrders = {
        ...values,
        linked_order_ids: linkedOrderIds,
      };
      
      await onSubmit(valuesWithLinkedOrders, !!transaction);
      
      if (!transaction) {
        form.reset();
        setSelectedOrders([]);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("form_submission_failed"),
      });
    }
  };

  const handleOrderSelection = (order: Order) => {
    const isOrderSelected = selectedOrders.some((selectedOrder) => selectedOrder.id === order.id);
    
    if (isOrderSelected) {
      setSelectedOrders((prevSelectedOrders) =>
        prevSelectedOrders.filter((selectedOrder) => selectedOrder.id !== order.id)
      );
    } else {
      setSelectedOrders((prevSelectedOrders) => [...prevSelectedOrders, order]);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="space-y-2">
          <SheetTitle>{transaction ? t("edit_transaction") : t("record_transaction")}</SheetTitle>
          <SheetDescription>
            {transaction
              ? t("edit_transaction_details")
              : t("enter_transaction_details")}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("amount")}</FormLabel>
                  <FormControl>
                    <Input placeholder="0.00" {...field} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_currency")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("type")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_type")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="purchase">{t("purchase")}</SelectItem>
                      <SelectItem value="refund">{t("refund")}</SelectItem>
                      <SelectItem value="payout">{t("payout")}</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_status")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="success">{t("success")}</SelectItem>
                      <SelectItem value="pending">{t("pending")}</SelectItem>
                      <SelectItem value="failed">{t("failed")}</SelectItem>
                      <SelectItem value="unmatched">{t("unmatched")}</SelectItem>
                      <SelectItem value="matched">{t("matched")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("payment_method")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("enter_payment_method")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>{t("link_orders")}</FormLabel>
              
              {selectedOrders.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedOrders.map((order) => (
                    <Badge key={order.id} variant="secondary">
                      {order.order_number || order.id.substring(0, 8)}
                      <button 
                        onClick={() => handleOrderSelection(order)}
                        className="ml-1 inline-flex items-center justify-center rounded-full p-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary/50"
                        aria-label="Unlink order"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <Popover open={isMultiOrderLinkingOpen} onOpenChange={setIsMultiOrderLinkingOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Link className="mr-2 h-4 w-4" />
                    {t("link_existing_orders")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[600px] p-0">
                  <Command>
                    <CommandInput placeholder={t("search_orders")} />
                    <CommandList>
                      <CommandEmpty>{t("no_orders_found")}</CommandEmpty>
                      <CommandGroup heading={t("available_orders")}>
                        {orders.map((order) => {
                          const isOrderSelected = selectedOrders.some(
                            (selectedOrder) => selectedOrder.id === order.id
                          );
                          
                          return (
                            <CommandItem
                              key={order.id}
                              onSelect={() => handleOrderSelection(order)}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{order.order_number || order.id.substring(0, 8)}</span>
                                <Checkbox
                                  checked={isOrderSelected}
                                  onCheckedChange={() => handleOrderSelection(order)}
                                  aria-label={`Link order ${order.order_number || order.id}`}
                                />
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("notes")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("enter_notes")}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter>
              <Button type="submit">{transaction ? t("update_transaction") : t("record_transaction")}</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default TransactionDrawer;
