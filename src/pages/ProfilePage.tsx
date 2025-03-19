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
  FormMessage 
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import AddressList from "@/components/profile/AddressList";
import { useQuery } from "@tanstack/react-query";

// ✅ Define allowed business types
const BUSINESS_TYPES = ["Sole Proprietorship", "LLC", "GmbH", "AG", "Freelancer", "Corporation"] as const;

// ✅ Update Zod schema with enum validation for business type
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  business_type: z.enum(BUSINESS_TYPES).optional().nullable(),
  eu_vat_id: z.string().optional().nullable(),
  tax_number: z.string().optional().nullable(),
  eori_number: z.string().optional().nullable()
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [vatData, setVatData] = useState<any>(null);

  // ✅ Initialize form with validation
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      business_type: undefined,
      eu_vat_id: "",
      tax_number: "",
      eori_number: ""
    },
  });

  // ✅ Fetch user profile data
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
          title: "Error",
          description: "Could not load your profile. Please try again.",
          variant: "destructive",
        });
        throw error;
      }

      return data;
    },
    enabled: !!user,
  });

  // ✅ Update form values when profile data is loaded
  useEffect(() => {
    if (profileData) {
      form.reset({
        name: profileData.name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        business_type: profileData.business_type || undefined,
        eu_vat_id: profileData.eu_vat_id || "",
        tax_number: profileData.tax_number || "",
        eori_number: profileData.eori_number || ""
      });
    }
  }, [profileData, form]);

  // ✅ Auto-fill VAT details from an external API (mock function)
  const fetchVatDetails = async (vatId: string) => {
    if (!vatId || vatId.length < 5) return;
    
    setVatData(null);
    try {
      setTimeout(() => {
        const mockData = {
          valid: true,
          business_name: "Sample Business " + vatId.substring(0, 4).toUpperCase(),
          address: "123 Business St, Business City",
          country_code: "DE"
        };
        setVatData(mockData);
        form.setValue("business_type", "LLC"); // Example of autofill
      }, 1000);
    } catch (error) {
      console.error("VAT API Error:", error);
      toast({
        title: "VAT Validation Failed",
        description: "Could not validate the VAT ID. Please check and try again.",
        variant: "destructive",
      });
    }
  };

  // ✅ Handle form submission
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
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingProfile && !profileData) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
        </TabsList>

        {/* ✅ Business Info Tab */}
        <TabsContent value="business">
          <div className="max-w-2xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* ✅ Business Type Dropdown */}
                <FormField
                  control={form.control}
                  name="business_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your business type" />
                          </SelectTrigger>
                          <SelectContent>
                            {BUSINESS_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={loading || isLoadingProfile}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </Form>
          </div>
        </TabsContent>

        {/* ✅ Addresses Tab */}
        <TabsContent value="addresses">
          {user && <AddressList userId={user.id} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
