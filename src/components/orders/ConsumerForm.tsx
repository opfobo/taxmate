
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
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
import { Loader2, Save, X } from "lucide-react";

const consumerFormSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required" }),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  postalCode: z.string().min(1, { message: "Postal code is required" }),
  phone: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
});

type ConsumerFormValues = z.infer<typeof consumerFormSchema>;

interface ConsumerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onConsumerCreated: (consumerId: string) => void;
}

export const ConsumerForm = ({ isOpen, onClose, onConsumerCreated }: ConsumerFormProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ConsumerFormValues>({
    resolver: zodResolver(consumerFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      postalCode: "",
      phone: "",
      city: "",
    },
  });

  const onSubmit = async (values: ConsumerFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Insert new consumer
      const { data, error } = await supabase
        .from("consumers")
        .insert({
          user_id: user.id,
          full_name: values.fullName,
          email: values.email || null,
          postal_code: values.postalCode,
          phone: values.phone || null,
          city: values.city || null,
        })
        .select("id")
        .single();
      
      if (error) throw error;
      
      toast({
        title: t("consumer_created"),
        description: t("consumer_created_successfully"),
      });
      
      onConsumerCreated(data.id);
      onClose();
    } catch (error: any) {
      console.error("Error creating consumer:", error);
      toast({
        title: t("error"),
        description: error.message || t("consumer_creation_failed"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("add_new_customer")}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("full_name")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("full_name_placeholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder={t("email_placeholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("postal_code")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("postal_code_placeholder")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("city")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("city_placeholder")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("phone")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("phone_placeholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 mr-2" />
                {t("cancel")}
              </Button>
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {t("save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
