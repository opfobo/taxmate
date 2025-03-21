
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import AddressList from "@/components/profile/AddressList";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { useTranslation } from "@/hooks/useTranslation";

// Define a type for business type
type BusinessType = "SOLO" | "GmbH" | "UG" | "Freelancer" | "Other";

// Zod schema for validation
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  business_type: z.enum(["SOLO", "GmbH", "UG", "Freelancer", "Other"]).optional().nullable(),
  eu_vat_id: z.string().optional().nullable(),
  tax_number: z.string().optional().nullable(),
  eori_number: z.string().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  // Initialize the form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      business_type: null,
      eu_vat_id: "",
      tax_number: "",
      eori_number: "",
    },
  });

  // Fetch user profile data
  const { isLoading: isLoadingProfile, data: profileData } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        toast({
          title: t("profile_load_error"),
          description: t("profile_load_fail"),
          variant: "destructive",
        });
        throw error;
      }

      return data;
    },
    enabled: !!user,
  });

  // Update form values when profile data is loaded
  useEffect(() => {
    if (profileData) {
      // Type casting business_type to ensure it matches the expected enum values
      const businessType = profileData.business_type as BusinessType | null;
      
      // Using direct object instead of a function to avoid TypeScript errors
      form.reset({
        name: profileData.name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        business_type: businessType,
        eu_vat_id: profileData.eu_vat_id || "",
        tax_number: profileData.tax_number || "",
        eori_number: profileData.eori_number || "",
      });
    }
  }, [profileData, form]);

  // Handle form submission
  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: values.name,
          phone: values.phone,
          business_type: values.business_type,
          eu_vat_id: values.eu_vat_id,
          tax_number: values.tax_number,
          eori_number: values.eori_number,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: t("profile_updated"),
        description: t("profile_update_success"),
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: t("profile_update_failed"),
        description: error.message || t("profile_load_fail"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">{t("profile_settings")}</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="personal">{t("personal_info")}</TabsTrigger>
            <TabsTrigger value="business">{t("business_info")}</TabsTrigger>
            <TabsTrigger value="addresses">{t("addresses")}</TabsTrigger>
          </TabsList>

          {/* ✅ Fully Restored Personal Info Tab */}
          <TabsContent value="personal">
            <div className="max-w-2xl">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("full_name")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("name_placeholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("email_address")}</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-muted/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("phone_number")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("phone_placeholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" disabled={loading || isLoadingProfile}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("save_changes")}
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent>

          {/* ✅ Fully Restored Business Info Tab */}
          <TabsContent value="business">
            <div className="max-w-2xl">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField control={form.control} name="business_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("business_type")}</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_business_type")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SOLO">{t("SOLO")}</SelectItem>
                            <SelectItem value="GmbH">{t("GmbH")}</SelectItem>
                            <SelectItem value="UG">{t("UG")}</SelectItem>
                            <SelectItem value="Freelancer">{t("Freelancer")}</SelectItem>
                            <SelectItem value="Other">{t("Other")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="eu_vat_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("eu_vat_id")}</FormLabel>
                      <FormControl>
                        <Input placeholder="DE123456789" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="tax_number" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("tax_number")}</FormLabel>
                      <FormControl>
                        <Input placeholder="123/456/78901" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="eori_number" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("eori_number")}</FormLabel>
                      <FormControl>
                        <Input placeholder="DE1234567890123" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" disabled={loading || isLoadingProfile}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("save_changes")}
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            {user && <AddressList userId={user.id} />}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ProfilePage;
