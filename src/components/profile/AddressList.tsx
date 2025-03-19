import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tables } from "@/integrations/supabase/types";

interface AddressFormProps {
  userId: string;
  address?: Tables<"addresses">;
  onClose: () => void;
}

const AddressForm = ({ userId, address, onClose }: AddressFormProps) => {
  const { toast } = useToast();
  const [type, setType] = useState(address?.type || "home");
  const [street, setStreet] = useState(address?.street || "");
  const [zip, setZip] = useState(address?.zip || "");
  const [city, setCity] = useState(address?.city || "");
  const [country, setCountry] = useState(address?.country || "Deutschland");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log("Submitting Address:", { userId, type, street, zip, city, country });

    if (!street || !zip || !city || !country) {
      toast({ title: "Error", description: "All fields are required.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const addressData = { user_id: userId, type, street, zip, city, country };

    const { error } = address
      ? await supabase.from("addresses").update(addressData).eq("id", address.id)
      : await supabase.from("addresses").insert(addressData);

    if (error) {
      console.error("Error saving address:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Address ${address ? "updated" : "added"} successfully.` });
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
