import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { Consumer } from "@/types/consumer";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Define the form schema
const formSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
});

// Export the FormValues type so it can be used in the interface
export type FormValues = z.infer<typeof formSchema>;

interface ConsumerEditFormProps {
  consumer: Consumer;
  onComplete: (values: FormValues) => void;
  onCancel: () => void;
}

const ConsumerEditForm = ({ consumer, onComplete, onCancel }: ConsumerEditFormProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Initialize form with consumer data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: consumer.full_name,
      email: consumer.email || "",
      phone: consumer.phone || "",
      address_line1: consumer.address_line1 || "",
      address_line2: consumer.address_line2 || "",
      city: consumer.city || "",
      region: consumer.region || "",
      postal_code: consumer.postal_code || "",
      country: consumer.country || "",
    },
  });

  // Mutation to update consumer
  const updateConsumerMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { error } = await supabase
        .from("consumers")
        .update({
          ...values,
          updated_at: new Date().toISOString(),
        })
        .eq("id", consumer.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({
        title: t("consumer_updated"),
        description: t("consumer_details_saved_successfully"),
      });
      onComplete(form.getValues());
    },
    onError: (error) => {
      console.error("Error updating consumer:", error);
      toast({
        title: t("update_failed"),
        description: error instanceof Error ? error.message : t("unknown_error"),
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    // If this is a new consumer (id is 'new'), pass the form data to onComplete
    if (consumer.id === 'new') {
      onComplete(data);
      return;
    }
    
    // Otherwise update an existing consumer
    updateConsumerMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{consumer.id === 'new' ? t("create_consumer") : t("edit_consumer")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {/* Full Name */}
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("full_name")}</FormLabel>
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
                disabled={updateConsumerMutation.isPending}
              >
                {updateConsumerMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {consumer.id === 'new' ? t("create") : t("save_changes")}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ConsumerEditForm;
