
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
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

  // Fetch user addresses
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
        title: "Address deleted",
        description: "The address has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting address",
        description: error.message || "Something went wrong.",
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

  const renderAddressTypeLabel = (type: string) => {
    switch (type) {
      case "Home":
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">Home</span>;
      case "Business":
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs">Business</span>;
      case "Shipping":
        return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-xs">Shipping</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-xs">{type}</span>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <p>There was an error loading your addresses.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please refresh the page or try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Addresses</CardTitle>
          {(!addresses || addresses.length < 3) && (
            <Button variant="outline" size="sm" onClick={handleAddNewAddress} disabled={isAddressFormOpen}>
              <Plus className="mr-2 h-4 w-4" />
              Add Address
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
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">You don't have any addresses yet.</p>
                  <Button onClick={handleAddNewAddress}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          {renderAddressTypeLabel(address.type)}
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
                      <div className="mt-2">
                        <p className="font-medium">{address.street}</p>
                        <p className="text-muted-foreground">
                          {address.zip} {address.city}, {address.country}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default AddressList;
