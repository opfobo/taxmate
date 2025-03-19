import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tables } from "@/integrations/supabase/types";
import { useQueryClient } from "@tanstack/react-query";

interface AddressFormProps {
  userId: string;
  address?: Tables<"addresses">;
  onClose: () => void;
}

const AddressForm = ({ userId, address, onClose }: AddressFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State für Adressdaten
  const [type, setType] = useState(address?.type || "home");
  const [street, setStreet] = useState(address?.street || "");
  const [zip, setZip] = useState(address?.zip || "");
  const [city, setCity] = useState(address?.city || "");
  const [country, setCountry] = useState(address?.country || "Deutschland");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("📌 Aktueller Adresstyp:", type);
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log("🔄 Überprüfe bestehende Adresse für Typ:", type);

    // Überprüfen, ob eine Adresse mit demselben Typ bereits existiert
    const { data: existingAddresses, error: checkError } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", userId)
      .eq("type", type);

    if (checkError) {
      console.error("❌ Fehler beim Prüfen vorhandener Adressen:", checkError);
      toast({ title: "Fehler", description: "Datenbankfehler beim Überprüfen bestehender Adresse.", variant: "destructive" });
      setLoading(false);
      return;
    }

    console.log("🔎 Gefundene Adressen:", existingAddresses);

    // Adress-Objekt für Supabase
    const addressData = { user_id: userId, type, street, zip, city, country };

    let saveError = null;
    
    if (existingAddresses && existingAddresses.length > 0) {
      // Falls Adresse existiert → Update
      const { error } = await supabase
        .from("addresses")
        .update(addressData)
        .eq("id", existingAddresses[0].id);

      saveError = error;
      console.log("✏️ Adresse aktualisiert:", existingAddresses[0].id);
    } else {
      // Falls keine existiert → Neue Adresse anlegen
      const { error } = await supabase.from("addresses").insert(addressData);
      saveError = error;
      console.log("✅ Neue Adresse gespeichert.");
    }

    if (saveError) {
      console.error("❌ Fehler beim Speichern der Adresse:", saveError);
      toast({ title: "Fehler", description: saveError.message, variant: "destructive" });
    } else {
      toast({ title: "Erfolg", description: `Adresse wurde ${existingAddresses.length > 0 ? "aktualisiert" : "hinzugefügt"}.` });
      queryClient.invalidateQueries(["addresses", userId]); // Frontend aktualisieren
      onClose();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Address Type</label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="home">Home</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="shipping">Shipping</SelectItem>
            <SelectItem value="billing">Billing</SelectItem>
            <SelectItem value="warehouse">Warehouse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Street Address</label>
        <Input value={street} onChange={(e) => setStreet(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">ZIP/Postal Code</label>
          <Input value={zip} onChange={(e) => setZip(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium">City</label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Country</label>
        <Input value={country} onChange={(e) => setCountry(e.target.value)} required />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : address ? "Update Address" : "Add Address"}
        </Button>
      </div>
    </form>
  );
};

export default AddressForm;
