import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { Shopper } from "@/types/shopper";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface ShopperEditFormProps {
  shopper: Shopper;
  onComplete: (values: FormValues) => void;
  onCancel: () => void;
}

const ShopperEditForm = ({ shopper, onComplete, onCancel }: ShopperEditFormProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Define form validation schema
  const formSchema = z.object({
    salutation: z.string().optional(),
    first_name: z.string().min(1, t("first_name_required")),
    last_name: z.string().min(1, t("last_name_required")),
    email: z.string().email(t("invalid_email")).optional().or(z.literal("")),
    phone: z.string().optional(),
    address_line1: z.string().optional(),
    address_line2: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  // Initialize form with shopper data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salutation: shopper.salutation || "",
      first_name: shopper.first_name,
      last_name: shopper.last_name,
      email: shopper.email || "",
      phone: shopper.phone || "",
      address_line1: shopper.address_line1 || "",
      address_line2: shopper.address_line2 || "",
      city: shopper.city || "",
      region: shopper.region || "",
      postal_code: shopper.postal_code || "",
      country: shopper.country || "",
    },
  });

  // Mutation to update shopper
  const updateShopperMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { error } = await supabase
        .from("shoppers")
        .update({
          ...values,
          updated_at: new Date().toISOString(),
        })
        .eq("id", shopper.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({
        title: t("shopper_updated"),
        description: t("shopper_details_saved_successfully"),
      });
      onComplete(form.getValues());
    },
    onError: (error) => {
      console.error("Error updating shopper:", error);
      toast({
        title: t("update_failed"),
        description: error instanceof Error ? error.message : t("unknown_error"),
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    // If this is a new shopper (id is 'new'), pass the form data to onComplete
    if (shopper.id === 'new') {
      onComplete(data);
      return;
    }
    
    // Otherwise update an existing shopper
    updateShopperMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{shopper.id === 'new' ? t("create_shopper") : t("edit_shopper")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Salutation */}
              <FormField
                control={form.control}
                name="salutation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("salutation")}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_salutation")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t("none")}</SelectItem>
                        <SelectItem value="Mr">{t("mr")}</SelectItem>
                        <SelectItem value="Mrs">{t("mrs")}</SelectItem>
                        <SelectItem value="Ms">{t("ms")}</SelectItem>
                        <SelectItem value="Dr">{t("dr")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* First Name */}
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("first_name")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Last Name */}
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("last_name")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phone")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Address Line 1 */}
              <FormField
                control={form.control}
                name="address_line1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("address_line1")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Address Line 2 */}
              <FormField
                control={form.control}
                name="address_line2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("address_line2")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* City */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("city")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Postal Code */}
              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("postal_code")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Region/State */}
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("region")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Country */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("country")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <CardFooter className="px-0 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="mr-2"
              >
                {t("cancel")}
              </Button>
              <Button 
                type="submit"
                disabled={updateShopperMutation.isPending}
              >
                {updateShopperMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {shopper.id === 'new' ? t("create") : t("save_changes")}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ShopperEditForm;
