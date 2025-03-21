
import React, { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, Clock, AlertCircle, Package, Truck, CircleCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
    try {
      const now = new Date().toISOString();
      
      // Update the order status
      const { error } = await supabase
        .from("orders")
        .update({ 
          status,
          updated_at: now
        })
        .eq("id", orderId);

      if (error) throw error;
      
      // Add a record to status history (if implemented)
      // This could be added in the future to track full status history
      
      toast({
        title: t("status_updated"),
        description: t("order_status_updated_successfully"),
      });
      
      onUpdated();
    } catch (error: any) {
      console.error("Error updating order status:", error.message);
      toast({
        title: t("update_failed"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "accepted": return <CheckCircle className="h-4 w-4" />;
      case "declined": return <AlertCircle className="h-4 w-4" />;
      case "processing": return <Package className="h-4 w-4" />;
      case "shipped": return <Truck className="h-4 w-4" />;
      case "delivered": return <CircleCheck className="h-4 w-4" />;
      default: return null;
    }
  };
  
  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case "pending": return "text-yellow-600";
      case "accepted": return "text-blue-600";
      case "declined": return "text-red-600";
      case "processing": return "text-purple-600";
      case "shipped": return "text-indigo-600";
      case "delivered": return "text-green-600";
      default: return "";
    }
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Status Tracker */}
      <div className="flex gap-1 items-center justify-between mb-4">
        {statuses.map((s, index) => (
          <React.Fragment key={s}>
            <div 
              className={`flex flex-col items-center ${
                statuses.indexOf(status) >= index ? getStatusColor(s) : "text-gray-300"
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8">
                {getStatusIcon(s)}
              </div>
              <span className="text-xs mt-1">{t(s)}</span>
            </div>
            
            {index < statuses.length - 1 && (
              <div 
                className={`flex-1 h-0.5 ${
                  statuses.indexOf(status) > index ? "bg-primary" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      
      <div className="flex gap-4 items-center">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("status")} />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                <div className="flex items-center gap-2">
                  <span className={getStatusColor(status)}>
                    {getStatusIcon(status)}
                  </span>
                  {t(status)}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleUpdate} disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {t("save")}
        </Button>
      </div>
    </div>
  );
};

export default OrderStatusUpdateForm;
