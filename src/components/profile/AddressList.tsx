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

  // 🏷️ Korrekte Labels für Adress-Typen (Datenbankwerte beachten!)
  const renderAddressTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "home":
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">Home</span>;
      case "business":
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs">Business</span>;
      case "shipping":
        return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-xs">Shipping</span>;
      case "billing":
        return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-md text-xs">Billing</span>;
      case "warehouse":
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-xs">Warehouse</span>;
      default:
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-md text-xs">Unknown</span>;
    }
  };

  // 🛠 Adressen aus Supabase abrufen
  const { data: addresses, isLoading, error } = useQuery({
    queryKey: ["addresses", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      console.log("🔍 Supabase AddressList Data:", data);
      console.log("❌ Supabase AddressList Error:", error);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // 🗑️ Adresse löschen
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
      toast({ title: "Adresse gelöscht", description: "Die Adresse wurde erfolgreich entfernt." });
    },
    onError: (error) => {
      toast({ title: "Fehler beim Löschen", description: error.message || "Etwas ist schiefgelaufen.", variant: "destructive" });
    },
  });

  const handleDeleteAddress = (addressId: string) => {
    if (confirm("Möchtest du diese Adresse wirklich löschen?")) {
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

  // 🔄 Ladezustand
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

  // ❌ Fehlerzustand
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <p>Fehler beim Laden der Adressen.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Bitte lade die Seite neu oder versuche es später erneut.
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
                  <p className="text-muted-foreground mb-4">Du hast noch keine Adressen gespeichert.</p>
                  <Button onClick={handleAddNewAddress}>
                    <Plus className="mr-2 h-4 w-4" />
                    Erste Adresse hinzufügen
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>{renderAddressTypeLabel(address.type)}</div>
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
