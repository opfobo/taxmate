
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// 🔹 Zod Schema for validation
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  businessType: z.string().optional(),
  vatId: z.string().optional(),
  taxationNumber: z.string().optional(),
  eoriNumber: z.string().optional(),
  addresses: z.array(
    z.object({
      type: z.enum(["home", "business", "warehouse"]),
      street: z.string(),
      street2: z.string().optional(),
      zip: z.string(),
      city: z.string(),
      country: z.string(),
      phone: z.string().optional(),
    })
  ),
});

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [selectedAddressType, setSelectedAddressType] = useState("home");
  const [vatData, setVatData] = useState(null);

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      businessType: "",
      vatId: "",
      taxationNumber: "",
      eoriNumber: "",
      addresses: [],
    },
  });

  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
    }
  }, [user]);

  const fetchProfile = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();

    if (error) {
      toast({ title: "Error", description: "Could not load profile.", variant: "destructive" });
    } else {
      form.reset(data);
    }
    setLoading(false);
  };

  // 🔹 Auto-fill VAT details from an external API (Placeholder)
  const fetchVatDetails = async (vatId) => {
    if (!vatId) return;
    try {
      const response = await fetch(`https://some-vat-api.com/validate/${vatId}`);
      const data = await response.json();
      setVatData(data);
      form.setValue("businessType", data.business_name || "");
    } catch (error) {
      console.error("VAT API Error:", error);
    }
  };

  const onSubmit = async (values) => {
    setLoading(true);
    const { error } = await supabase.from("users").update(values).eq("id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile updated!" });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Profile Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
        </TabsList>

        {/* 🔹 Personal Info Tab */}
        <TabsContent value="personal">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" disabled={loading}>Save Changes</Button>
            </form>
          </Form>
        </TabsContent>

        {/* 🔹 Business Info Tab */}
        <TabsContent value="business">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="businessType" render={({ field }) => (
                <FormItem><FormLabel>Business Type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="vatId" render={({ field }) => (
                <FormItem>
                  <FormLabel>VAT ID</FormLabel>
                  <FormControl><Input {...field} onBlur={() => fetchVatDetails(field.value)} /></FormControl>
                  {vatData && <p>✅ Business Name: {vatData.business_name}</p>}
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="taxationNumber" render={({ field }) => (
                <FormItem><FormLabel>Taxation Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="eoriNumber" render={({ field }) => (
                <FormItem><FormLabel>EORI Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" disabled={loading}>Save Changes</Button>
            </form>
          </Form>
        </TabsContent>

        {/* 🔹 Address Management Tab */}
        <TabsContent value="addresses">
          <select onChange={(e) => setSelectedAddressType(e.target.value)} className="mb-4">
            <option value="home">Home Address</option>
            <option value="business">Business Address</option>
            <option value="warehouse">Warehouse Address</option>
          </select>

          {form.watch("addresses").map((address, index) =>
            address.type === selectedAddressType ? (
              <div key={index} className="space-y-4">
                <FormField control={form.control} name={`addresses.${index}.street`} render={({ field }) => (
                  <FormItem><FormLabel>Street</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name={`addresses.${index}.zip`} render={({ field }) => (
                  <FormItem><FormLabel>ZIP Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={loading}>Save Address</Button>
              </div>
            ) : null
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
