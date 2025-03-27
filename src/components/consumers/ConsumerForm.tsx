
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { Consumer } from "@/types/consumer";
import { useToast } from "@/hooks/use-toast";
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
export type ConsumerFormValues = z.infer<typeof formSchema>;

interface ConsumerFormProps {
  existingConsumer?: Consumer;
  onComplete: () => void;
  onCancel: () => void;
}

const ConsumerForm = ({ existingConsumer, onComplete, onCancel }: ConsumerFormProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const isEditing = !!existingConsumer;

  // Initialize form with consumer data if editing
  const form = useForm<ConsumerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: existingConsumer?.full_name || "",
      email: existingConsumer?.email || "",
      phone: existingConsumer?.phone || "",
      address_line1: existingConsumer?.address_line1 || "",
      address_line2: existingConsumer?.address_line2 || "",
      city: existingConsumer?.city || "",
      region: existingConsumer?.region || "",
      postal_code: existingConsumer?.postal_code || "",
      country: existingConsumer?.country || "",
    },
  });

  // Mutation to create or update consumer
  const mutation = useMutation({
    mutationFn: async (values: ConsumerFormValues) => {
      if (isEditing && existingConsumer) {
        // Update existing consumer
        const { error } = await supabase
          .from("consumers")
          .update({
            ...values,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingConsumer.id);

        if (error) throw error;
        return { success: true, action: "updated" };
      } else {
        // Create new consumer
        const { error } = await supabase
          .from("consumers")
          .insert({
            ...values,
            user_id: (await supabase.auth.getUser()).data.user?.id,
          });

        if (error) throw error;
        return { success: true, action: "created" };
      }
    },
    onSuccess: (data) => {
      toast({
        title: data.action === "created" ? t("consumer_created") : t("consumer_updated"),
        description: data.action === "created" 
          ? t("consumer_created_successfully") 
          : t("consumer_updated_successfully"),
      });
      onComplete();
    },
    onError: (error) => {
      console.error("Error saving consumer:", error);
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("unknown_error"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConsumerFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Form control={form.control}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
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
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            
            {/* Region */}
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
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            {t("cancel")}
          </Button>
          <Button 
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? t("save_changes") : t("create_consumer")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ConsumerForm;
