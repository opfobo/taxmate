
import React, { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CommandGroup, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Command } from "cmdk";
import { Badge } from "@/components/ui/badge";

interface OrderStatusUpdateFormProps {
  orderId: string;
  currentStatus: string;
  onUpdated: () => void;
}

// Define the valid status values to match the database enum
type OrderStatus = "pending" | "accepted" | "declined" | "processing" | "shipped" | "delivered";

const statuses = [
  { value: "pending", label: "pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "accepted", label: "accepted", color: "bg-blue-100 text-blue-800" },
  { value: "processing", label: "processing", color: "bg-purple-100 text-purple-800" },
  { value: "shipped", label: "shipped", color: "bg-indigo-100 text-indigo-800" },
  { value: "delivered", label: "delivered", color: "bg-green-100 text-green-800" },
  { value: "declined", label: "declined", color: "bg-red-100 text-red-800" },
];

const OrderStatusUpdateForm: React.FC<OrderStatusUpdateFormProps> = ({
  orderId,
  currentStatus,
  onUpdated,
}) => {
  const { t } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus);

  const handleUpdateStatus = async (newStatus: string) => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      // Update the order status
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (error) throw error;

      // Record the status change in history - Fix the type error by making sure status is a valid enum value
      const { error: historyError } = await supabase
        .from("order_status_history")
        .insert({
          order_id: orderId,
          status: newStatus as OrderStatus, // Cast to OrderStatus type
          changed_at: new Date().toISOString(),
          notes: `Status updated to ${t(newStatus)}`
        });

      if (historyError) {
        console.error("Failed to record status history:", historyError);
      }

      setSelectedStatus(newStatus);
      toast({
        title: t("status_updated"),
        // Fix: Using the t() function correctly with interpolation
        description: t(`order_status_updated_to_status_${newStatus}`),
      });
      onUpdated();
    } catch (error: any) {
      console.error("Error updating status:", error.message);
      toast({
        title: t("update_failed"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  const getCurrentStatusDetails = () => {
    return statuses.find(status => status.value === selectedStatus) || 
      { value: selectedStatus, label: selectedStatus, color: "bg-gray-100 text-gray-800" };
  };

  const statusDetails = getCurrentStatusDetails();

  return (
    <div className="mt-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <React.Fragment>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("updating")}
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Badge className={statusDetails.color + " mr-2"}>
                  {t(statusDetails.label)}
                </Badge>
                {t("change_status")}
              </React.Fragment>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Command>
            <CommandList>
              <CommandGroup heading={t("select_status")}>
                {statuses.map((status) => (
                  <CommandItem
                    key={status.value}
                    onSelect={() => handleUpdateStatus(status.value)}
                    className="flex items-center"
                  >
                    <Badge className={status.color + " mr-2"}>
                      {t(status.label)}
                    </Badge>
                    {status.value === selectedStatus && (
                      <Check className="ml-auto h-4 w-4 text-green-500" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default OrderStatusUpdateForm;
