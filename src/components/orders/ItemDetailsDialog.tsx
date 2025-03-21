import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import ImageUpload from "./ImageUpload";

const schema = z.object({
  product_name: z.string().min(1),
  quantity: z.coerce.number().min(1),
  unit_price: z.coerce.number().min(0),
  supplier_id: z.string().uuid(),
});

type ItemDetailsProps = {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onItemSaved: () => void;
};

const ItemDetailsDialog = ({ orderId, isOpen, onClose, onItemSaved }: ItemDetailsProps) => {
  const { t } = useTranslation();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      product_name: "",
      quantity: 1,
      unit_price: 0,
      supplier_id: "",
    },
  });

  const { setValue, watch, handleSubmit, reset } = form;
  const quantity = watch("quantity");
  const unit_price = watch("unit_price");

  const total_price = quantity * unit_price;

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen]);

  const onSubmit = async (values: any) => {
    const { error } = await supabase.from("order_items").insert({
      ...values,
      order_id: orderId,
      total_price,
    });

    if (!error) {
      onItemSaved();
      onClose();
    } else {
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("item_details")}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="product_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("product_name")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("quantity")}</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("unit_price")}</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>{t("total_price")}</FormLabel>
              <div className="px-3 py-2 border rounded-md bg-muted/30">{total_price.toFixed(2)} EUR</div>
            </div>

            <FormField
              control={form.control}
              name="supplier_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("supplier")}</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={t("select_supplier")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Fetch suppliers dynamically */}
                      {/* This can be replaced with actual supplier data */}
                      <SelectItem value="supplier-1">Supplier 1</SelectItem>
                      <SelectItem value="supplier-2">Supplier 2</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>{t("upload_image")}</FormLabel>
              <ImageUpload
                storagePath="order_images"
                entityId={orderId}
                entityType="order_items"
              />
            </div>

            <Button type="submit" className="w-full">
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                t("save")
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailsDialog;
