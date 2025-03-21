import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

type SupplierFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSupplierCreated: () => void;
};

export const SupplierForm = ({ isOpen, onClose, onSupplierCreated }: SupplierFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;

    if (!name.trim()) {
      toast({
        title: t("missing_name"),
        description: t("supplier_name_required"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("suppliers").insert([
      {
        user_id: user.id,
        name,
        contact,
        website,
      },
    ]);

    setIsSubmitting(false);

    if (error) {
      console.error("Error creating supplier:", error);
      toast({
        title: t("error"),
        description: t("supplier_creation_failed"),
        variant: "destructive",
      });
    } else {
      toast({
        title: t("supplier_created"),
        description: t("supplier_created_successfully"),
      });
      setName("");
      setContact("");
      setWebsite("");
      onSupplierCreated();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("add_supplier")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("supplier_name_placeholder")}
            />
          </div>
          <div>
            <Label htmlFor="contact">{t("contact")}</Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t("supplier_contact_placeholder")}
            />
          </div>
          <div>
            <Label htmlFor="website">{t("website")}</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder={t("supplier_website_placeholder")}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? t("saving") + "..." : t("save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
