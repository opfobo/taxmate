
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "@/hooks/useTranslation";
import { Transaction, Order } from "@/pages/TransactionsPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface TransactionFormProps {
  transaction?: Transaction | null;
  orders: Order[];
  onSubmit: (data: Partial<Transaction>, isEditing: boolean) => void;
  onCancel: () => void;
}

const TransactionForm = ({ transaction, orders, onSubmit, onCancel }: TransactionFormProps) => {
  const { t } = useTranslation();
  const isEditing = !!transaction;

  const form = useForm<Partial<Transaction>>({
    defaultValues: {
      amount: transaction?.amount || 0,
      currency: transaction?.currency || "EUR",
      type: transaction?.type ?? "purchase",
      payment_method: transaction?.payment_method || "",
      order_id: transaction?.order_id || undefined,
    },
  });

  const handleSubmit = (data: Partial<Transaction>) => {
    onSubmit(data, isEditing);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("transaction_type")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          name="order_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("link_to_order")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || "none"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_order")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">{t("no_order")}</SelectItem>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.order_number} ({new Intl.NumberFormat("de-DE", {
                        style: "currency",
                        currency: order.currency || "EUR"
                      }).format(order.amount)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button type="submit">
            {isEditing ? t("save_changes") : t("record_transaction")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TransactionForm;
