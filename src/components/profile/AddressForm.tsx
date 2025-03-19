
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tables } from "@/integrations/supabase/types";

const addressFormSchema = z.object({
  type: z.enum(["Home", "Business", "Shipping"]),
  street: z.string().min(3, "Street address is required"),
  zip: z.string().min(1, "ZIP/Postal code is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

interface AddressFormProps {
  userId: string;
  address: Tables<"addresses"> | null;
  onClose: () => void;
}

const AddressForm = ({ userId, address, onClose }: AddressFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!address;

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      type: address?.type as "Home" | "Business" | "Shipping" || "Home",
      street: address?.street || "",
      zip: address?.zip || "",
      city: address?.city || "",
      country: address?.country || "",
    },
  });

  // Create/Update address mutation
  const addressMutation = useMutation({
    mutationFn: async (values: AddressFormValues) => {
      if (isEditing && address) {
        // Update existing address
        const { data, error } = await supabase
          .from("addresses")
          .update({
            type: values.type,
            street: values.street,
            zip: values.zip,
            city: values.city,
            country: values.country,
            updated_at: new Date().toISOString(),
          })
          .eq("id", address.id)
          .select();
          
        if (error) {
          console.error("Error updating address:", error);
          throw error;
        }
        
        return data;
      } else {
        // Create new address
        const { data, error } = await supabase
          .from("addresses")
          .insert({
            user_id: userId,
            type: values.type,
            street: values.street,
            zip: values.zip,
            city: values.city,
            country: values.country,
          })
          .select();
          
        if (error) {
          // Check if it's the address limit error
          if (error.message.includes("can only have up to 3 addresses")) {
            throw new Error("You can only have up to 3 addresses.");
          }
          console.error("Error creating address:", error);
          throw error;
        }
        
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
      toast({
        title: isEditing ? "Address updated" : "Address added",
        description: isEditing 
          ? "Your address has been updated successfully." 
          : "Your address has been added successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: isEditing ? "Error updating address" : "Error adding address",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: AddressFormValues) => {
    addressMutation.mutate(values);
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-medium mb-4">
        {isEditing ? "Edit Address" : "Add New Address"}
      </h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select address type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Shipping">Shipping</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St, Apt 4B" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP/Postal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="10001" {...field} />
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
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="New York" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="United States" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={addressMutation.isPending}>
              {addressMutation.isPending ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                  Saving...
                </>
              ) : isEditing ? "Update Address" : "Add Address"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddressForm;
