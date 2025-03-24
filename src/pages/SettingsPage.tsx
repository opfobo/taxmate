
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import Navbar from "@/components/Navbar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define the form schema with validation
const settingsFormSchema = z.object({
  tax_id: z.string().min(1, { message: "Tax ID is required" }),
  vat_number: z.string().optional(),
  eori_number: z.string().optional(),
  company_name: z.string().optional(),
  legal_form: z.string().optional(),
  address_line1: z.string().min(1, { message: "Address is required" }),
  address_line2: z.string().optional(),
  postal_code: z.string().min(1, { message: "Postal code is required" }),
  city: z.string().min(1, { message: "City is required" }),
  region: z.string().optional(),
  country: z.string().min(1, { message: "Country is required" }),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Form initialization
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      tax_id: "",
      vat_number: "",
      eori_number: "",
      company_name: "",
      legal_form: "",
      address_line1: "",
      address_line2: "",
      postal_code: "",
      city: "",
      region: "",
      country: "",
    },
  });

  // Fetch user settings
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["settings", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "Row not found" error
        console.error("Error fetching settings:", error);
        throw error;
      }

      // If no settings found, create a new record
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from("settings")
          .insert([
            {
              user_id: user.id,
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error("Error creating settings:", insertError);
          throw insertError;
        }

        return newSettings;
      }

      return data;
    },
    enabled: !!user,
  });

  // Fetch user settings when component mounts
  useEffect(() => {
    if (settings) {
      // Set form values from fetched settings
      form.reset({
        tax_id: settings.tax_id || "",
        vat_number: settings.vat_number || "",
        eori_number: settings.eori_number || "",
        company_name: settings.company_name || "",
        legal_form: settings.legal_form || "",
        address_line1: settings.address_line1 || "",
        address_line2: settings.address_line2 || "",
        postal_code: settings.postal_code || "",
        city: settings.city || "",
        region: settings.region || "",
        country: settings.country || "",
      });
      
      // Set email notification preferences
      if (settings.email_notifications !== undefined) {
        setEmailNotifications(settings.email_notifications);
      }
    }
  }, [settings, form]);

  // Fetch user profile data
  const { data: userData } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) {
        console.error("Error fetching user profile:", error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  // Mutation to update settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("settings")
        .update({
          ...values,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: t("settings_updated"),
        description: t("settings_saved_successfully"),
      });
      queryClient.invalidateQueries({ queryKey: ["settings", user?.id] });
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
      toast({
        title: t("update_failed"),
        description: error.message || t("update_settings_error"),
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: SettingsFormValues) => {
    updateSettingsMutation.mutate(values);
  };

  // Handle email notifications toggle
  const handleSaveGeneralSettings = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({
          email_notifications: emailNotifications,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: t("settings_updated"),
        description: t("preferences_saved"),
      });
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast({
        title: t("update_failed"),
        description: error.message || t("update_settings_error"),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">{t("settings")}</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="general">{t("general")}</TabsTrigger>
            <TabsTrigger value="tax">{t("tax_details")}</TabsTrigger>
            <TabsTrigger value="notifications">{t("notifications")}</TabsTrigger>
            <TabsTrigger value="security">{t("security")}</TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general">
            <div className="max-w-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="language" className="font-medium">{t("language")}</Label>
                  <p className="text-sm text-muted-foreground">{t("select_language")}</p>
                </div>
                <LanguageSwitcher />
              </div>

              <Button 
                onClick={handleSaveGeneralSettings} 
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("save_settings")}
              </Button>
            </div>
          </TabsContent>

          {/* Tax Details Tab */}
          <TabsContent value="tax">
            {isSettingsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tax Information Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>{t("tax_details")}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="tax_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("tax_id")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("enter_tax_id")} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="vat_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("vat_number")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("enter_vat_number")} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="eori_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("eori_number")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("enter_eori_number")} {...field} />
                              </FormControl>
                              <FormDescription>
                                {t("eori_description")}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* Business Information Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>{t("business_information")}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="company_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("company_name")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("enter_company_name")} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="legal_form"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("legal_form")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("enter_legal_form")} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* Address Card */}
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle>{t("address")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="address_line1"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("address_line1")}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t("enter_address_line1")} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="address_line2"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("address_line2")}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t("enter_address_line2")} {...field} />
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
                                  <Input placeholder={t("enter_city")} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="postal_code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("postal_code")}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t("enter_postal_code")} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="region"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("region")}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t("enter_region")} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("country")}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t("enter_country")} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    disabled={updateSettingsMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    {t("save_changes")}
                  </Button>
                </form>
              </Form>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="max-w-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications" className="font-medium">{t("email_notifications")}</Label>
                  <p className="text-sm text-muted-foreground">{t("email_updates")}</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Button 
                onClick={handleSaveGeneralSettings} 
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("save_settings")}
              </Button>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-medium">{t("change_password")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("update_password_desc")}</p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">{t("current_password")}</Label>
                    <input 
                      id="current-password"
                      type="password"
                      className="w-full border rounded px-3 py-2 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">{t("new_password")}</Label>
                    <input 
                      id="new-password"
                      type="password"
                      className="w-full border rounded px-3 py-2 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">{t("confirm_password")}</Label>
                    <input 
                      id="confirm-password"
                      type="password"
                      className="w-full border rounded px-3 py-2 mt-1"
                    />
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                {t("change_password")}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default SettingsPage;
