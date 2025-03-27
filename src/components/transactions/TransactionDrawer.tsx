import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "@/hooks/useTranslation";
import { Transaction, Order } from "@/pages/TransactionsPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface TransactionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  orders: Order[];
  onSubmit: (data: Partial<Transaction>, isEditing: boolean) => void;
}

type TransactionStatus = "success" | "pending" | "failed" | "matched" | "unmatched";

type FormValues = {
  amount: number;
  currency: string;
  type: "purchase" | "refund" | "payout";
  status: TransactionStatus;
  payment_method: string;
  order_id?: string | null;
  notes?: string | null;
  linked_order_ids?: string[];
};

const TransactionDrawer = ({ 
  open, 
  onOpenChange, 
  transaction, 
  orders, 
  onSubmit 
}: TransactionDrawerProps) => {
  const { t } = useTranslation();
  const isEditing = !!transaction;
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [commandOpen, setCommandOpen] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      amount: transaction?.amount || 0,
      currency: transaction?.currency || "EUR",
      type: transaction?.type || "purchase",
      status: (transaction?.status as TransactionStatus) || "pending",
      payment_method: transaction?.payment_method || "",
      order_id: transaction?.order_id || undefined,
      notes: transaction?.notes || "",
      linked_order_ids: transaction?.linked_order_ids || [],
    },
  });

  useEffect(() => {
    if (transaction) {
      form.reset({
        amount: transaction.amount,
        currency: transaction.currency || "EUR",
        type: transaction.type || "purchase",
        status: (transaction.status as TransactionStatus) || "pending",
        payment_method: transaction.payment_method || "",
        order_id: transaction.order_id || undefined,
        notes: transaction.notes || "",
        linked_order_ids: transaction.linked_order_ids || [],
      });

      if (transaction.linked_order_ids && transaction.linked_order_ids.length > 0) {
        const filteredOrders = orders.filter(order => 
          transaction.linked_order_ids?.includes(order.id)
        );
        setSelectedOrders(filteredOrders);
      } else {
        setSelectedOrders([]);
      }
    } else {
      form.reset({
        amount: 0,
        currency: "EUR",
        type: "purchase",
        status: "pending",
        payment_method: "",
        order_id: undefined,
        notes: "",
        linked_order_ids: [],
      });
      setSelectedOrders([]);
    }
  }, [transaction, orders, form]);

  const handleSubmit = (data: FormValues) => {
    onSubmit({
      ...data,
      amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
    }, isEditing);
  };

  const toggleOrder = (order: Order) => {
    const currentValues = form.getValues().linked_order_ids || [];
    let newValues: string[];
    let newSelectedOrders: Order[];

    if (currentValues.includes(order.id)) {
      newValues = currentValues.filter(id => id !== order.id);
      newSelectedOrders = selectedOrders.filter(o => o.id !== order.id);
    } else {
      newValues = [...currentValues, order.id];
      newSelectedOrders = [...selectedOrders, order];
    }

    form.setValue('linked_order_ids', newValues);
    setSelectedOrders(newSelectedOrders);
  };

  const totalSelectedAmount = selectedOrders.reduce((sum, order) => sum + order.amount, 0);
  
  const amountDifference = form.watch('amount') - totalSelectedAmount;
  
  const amountsMatch = Math.abs(amountDifference) <= (form.watch('amount') * 0.01);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>
            {isEditing ? t("edit_transaction") : t("record_transaction")}
          </DrawerTitle>
          <DrawerDescription>
            {isEditing 
              ? t("edit_transaction_description") 
              : t("record_transaction_description")}
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="px-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("amount")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
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
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
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
                      <FormLabel>{t("transaction_type")}</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value as "purchase" | "refund" | "payout")} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_transaction_type")} />
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
                          <SelectItem value="pending">{t("pending")}</SelectItem>
                          <SelectItem value="success">{t("success")}</SelectItem>
                          <SelectItem value="failed">{t("failed")}</SelectItem>
                          <SelectItem value="matched">{t("matched")}</SelectItem>
                          <SelectItem value="unmatched">{t("unmatched")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("payment_method")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("enter_payment_method")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("notes")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("enter_transaction_notes")}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="linked_order_ids"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("match_orders")}</FormLabel>
                      <Popover open={commandOpen} onOpenChange={setCommandOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "justify-between",
                                !field.value?.length && "text-muted-foreground"
                              )}
                            >
                              {field.value?.length
                                ? t("orders_selected", { count: field.value.length })
                                : t("select_orders")}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder={t("search_orders")} />
                            <CommandList>
                              <CommandEmpty>{t("no_orders_found")}</CommandEmpty>
                              <CommandGroup>
                                {orders.map((order) => {
                                  const isSelected = field.value?.includes(order.id);
                                  return (
                                    <CommandItem
                                      key={order.id}
                                      value={order.id}
                                      onSelect={() => toggleOrder(order)}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <div>
                                          <span className="font-medium">{order.order_number}</span>
                                          <span className="ml-2">
                                            {formatCurrency(order.amount)}
                                          </span>
                                        </div>
                                        <Check className={cn(`h-4 w-4 ${isSelected ? "opacity-100" : "opacity-0"}`)} />

                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {selectedOrders.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">{t("selected_orders")}</div>
                    <div className="border rounded-md p-2 space-y-2">
                      {selectedOrders.map(order => (
                        <div key={order.id} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="font-mono">{order.order_number}</span>
                            <span className="ml-2 text-muted-foreground">
                              {formatCurrency(order.amount)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleOrder(order)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold">{t("total_orders_amount")}</span>
                          <span>
                            {formatCurrency(totalSelectedAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="font-semibold">{t("transaction_amount")}</span>
                          <span>
                            {formatCurrency(form.watch('amount'))}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="font-semibold">{t("difference")}</span>
                          <span className={amountsMatch ? "text-green-600" : "text-amber-600"}>
                            {formatCurrency(amountDifference)}
                          </span>
                        </div>
                        
                        <div className="mt-2">
                          {amountsMatch ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {t("amounts_match")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              {t("amounts_mismatch")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DrawerFooter className="px-0 pt-0">
                <Button type="submit">
                  {isEditing ? t("save_changes") : t("record_transaction")}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline">{t("cancel")}</Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default TransactionDrawer;
