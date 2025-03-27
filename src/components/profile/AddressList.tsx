
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import AddressForm from "./AddressForm";
import { Tables } from "@/integrations/supabase/types";

interface AddressListProps {
  userId: string;
}

const AddressList = ({ userId }: AddressListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingAddress, setEditingAddress] = useState<Tables<"addresses"> | null>(null);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);

  // Fetch addresses from Supabase
  const { data: addresses, isLoading, error } = useQuery({
    queryKey: ["addresses", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching addresses:", error);
        throw error;
      }

      return data as Tables<"addresses">[];
    },
    enabled: !!userId,
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", addressId);

      if (error) {
        console.error("Error deleting address:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
      toast({
        title: "Address Deleted",
        description: "The address has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Address",
        description: error.message || "An error occurred while deleting the address.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAddress = (addressId: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      deleteAddressMutation.mutate(addressId);
    }
  };

  const handleEditAddress = (address: Tables<"addresses">) => {
    setEditingAddress(address);
    setIsAddressFormOpen(true);
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setIsAddressFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsAddressFormOpen(false);
    setEditingAddress(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-destructive">Failed to load address information.</p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["addresses", userId] })} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Addresses</CardTitle>
        {(!addresses || addresses.length < 3) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddNewAddress} 
            disabled={isAddressFormOpen}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Address
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isAddressFormOpen ? (
          <AddressForm 
            userId={userId} 
            address={editingAddress}
            onClose={handleCloseForm} 
          />
        ) : (
          <>
            {!addresses || addresses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">You haven't added any addresses yet.</p>
                <Button onClick={handleAddNewAddress}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Address
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div key={address.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium">
                        {address.type?.charAt(0).toUpperCase() + address.type?.slice(1) || "Unknown"} Address
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditAddress(address)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteAddress(address.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm">
                      <p>{address.street}</p>
                      {address.additional_info && (
                        <p className="text-muted-foreground">{address.additional_info}</p>
                      )}
                      <p>
                        {address.zip} {address.city}, {address.county && `${address.county}, `}{address.country}
                      </p>
                      {address.phone && <p className="text-muted-foreground">📞 {address.phone}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AddressList;
