// src/components/orders/OrdersTable.tsx

import { useTranslation } from "@/hooks/useTranslation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Loader2, Eye } from "lucide-react";

interface OrdersTableProps {
  orders: any[];
  isLoading: boolean;
  onViewDetails: (order: any) => void;
  orderType: string;
}

const OrdersTable = ({ orders, isLoading, onViewDetails }: OrdersTableProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        {t("no_orders")}
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("order_number")}</TableHead>
            <TableHead>{t("order_date")}</TableHead>
            <TableHead>{t("total_price")}</TableHead>
            <TableHead>{t("currency")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("supplier")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.order_number}</TableCell>
              <TableCell>{format(new Date(order.order_date), "yyyy-MM-dd")}</TableCell>
              <TableCell>{order.total_price.toFixed(2)}</TableCell>
              <TableCell>{order.currency}</TableCell>
              <TableCell>{t(order.status)}</TableCell>
              <TableCell>{order.supplier?.name || "-"}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => onViewDetails(order)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {t("view")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersTable;
