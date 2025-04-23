
import React, { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface AssignedItem {
  id: string;
  assigned_quantity: number;
  created_at: string;
  inventory_item: {
    id: string;
    description: string;
    unit_price: number;
    mapping: {
      invoice_date: string;
      supplier_name: string;
    }[];
  };
}

interface AssignedItemsTableProps {
  orderId: string;
}

export const AssignedItemsTable = ({ orderId }: AssignedItemsTableProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<AssignedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignedItems = async () => {
      if (!orderId || !user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('get_order_inventory_items', { p_order_id: orderId });

        if (error) throw error;
        // Convert JSON strings to AssignedItem objects
        setItems(data ? (data as unknown as AssignedItem[]) : []);
      } catch (error) {
        console.error("Error fetching assigned items:", error);
        toast({
          title: t("error"),
          description: t("error_fetching_assigned_items"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedItems();
  }, [orderId, user, toast, t]);

  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">{t("loading")}</div>;
  }

  if (items.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t("no_assigned_items")}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("description")}</TableHead>
            <TableHead>{t("supplier")}</TableHead>
            <TableHead className="text-right">{t("quantity")}</TableHead>
            <TableHead>{t("assigned_on")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {item.inventory_item?.description || t("unknown_item")}
              </TableCell>
              <TableCell>
                {item.inventory_item?.mapping?.[0]?.supplier_name || t("unknown_supplier")}
              </TableCell>
              <TableCell className="text-right">
                {item.assigned_quantity}
              </TableCell>
              <TableCell>
                {new Date(item.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
