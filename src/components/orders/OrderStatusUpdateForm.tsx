import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Props {
  orderId: string;
  currentStatus: string;
  onUpdated: () => void;
}

const OrderStatusUpdateForm: React.FC<Props> = ({ orderId, currentStatus, onUpdated }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const statuses = ["pending", "accepted", "declined", "processing", "shipped", "delivered"];

  const handleUpdate = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    setLoading(false);

    if (error) {
      console.error("Error updating order status:", error);
    } else {
      onUpdated();
    }
  };

  return (
    <div className="flex gap-4 items-center">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t("status")} />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem key={status} value={status}>
              {t(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleUpdate} disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {t("save")}
      </Button>
    </div>
  );
};

export default OrderStatusUpdateForm;
