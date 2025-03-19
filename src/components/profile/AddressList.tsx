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

  // ✅ Adressen aus Supabase abrufen
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
        console.error("❌ Fehler beim Abrufen der Adressen:", error);
        throw error;
      }

      console.log("🔍 Geladene Adressen:", data);
      return data as Tables<"addresses">[];
    },
    enabled: !!userId,
  });

  // ✅ Löschen einer Adresse
  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", addressId);

      if (error) {
        console.error("❌ Fehler beim Löschen der Adresse:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
      toast({
        title: "Erfolgreich gelöscht",
        description: "Die Adresse wurde entfernt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler beim Löschen",
        description: error.message || "Ein Fehler ist aufgetreten.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAddress = (addressId: string) => {
    if (confirm("Diese Adresse wirklich löschen?")) {
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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Adressen</CardTitle>
          {(!addresses || addresses.length < 3) && (
            <Button variant="outline" size="sm" onClick={handleAddNewAddress} disabled={isAddressFormOpen}>
              <Plus className="mr-2 h-4 w-4" />
              Neue Adresse
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
                  <p className="text-muted-foreground mb-4">Keine Adresse vorhanden.</p>
                  <Button onClick={handleAddNewAddress}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adresse hinzufügen
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium">
                          {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
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
                      <div className="mt-2 text-sm">
                        <p className="font-medium">{address.street}</p>
                        {address.additional_info && (
                          <p className="text-muted-foreground">{address.additional_info}</p>
                        )}
                        <p className="text-muted-foreground">
                          {address.zip} {address.city}, {address.county && `${address.county}, `}{address.country}
                        </p>
                        <p className="text-muted-foreground">📞 {address.phone}</p>
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
