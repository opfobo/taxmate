// src/components/orders/OrdersTable.tsx

import { useTranslation } from "@/hooks/useTranslation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

interface OrdersTableProps {
  orders: any[];
  isLoading: boolean;
  onViewDetails: (order: any) => void;
  orderType: "fulfillment" | "supplier";
}

const OrdersTable = ({ orders, isLoading, onViewDetails, orderType }: OrdersTableProps) => {
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-200 text-yellow-800";
      case "accepted":
        return "bg-blue-200 text-blue-800";
      case "declined":
        return "bg-red-200 text-red-800";
      case "processing":
        return "bg-orange-200 text-orange-800";
      case "shipped":
        return "bg-indigo-200 text-indigo-800";
      case "delivered":
        return "bg-green-200 text-green-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="text-center text-muted-foreground py-10">
        {t("no_orders")}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("order_number")}</TableHead>
          <TableHead>{t("order_date")}</TableHead>
          <TableHead>{t("total_price")}</TableHead>
          <TableHead>{t("status")}</TableHead>
          <TableHead>{t("supplier")}</TableHead>
          <TableHead>{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>{order.order_number}</TableCell>
            <TableCell>
              {order.order_date ? format(new Date(order.order_date), "dd.MM.yyyy") : "-"}
            </TableCell>
            <TableCell>
              {order.total_price?.toFixed(2)} {order.currency || "EUR"}
            </TableCell>
            <TableCell>
              <Badge className={getStatusColor(order.status)}>
                {t(order.status)}
              </Badge>
            </TableCell>
            <TableCell>{order.supplier?.name || "-"}</TableCell>
            <TableCell>
              <Button size="sm" onClick={() => onViewDetails(order)} variant="outline" className="gap-1">
                <Eye className="w-4 h-4" />
                {t("view")}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default OrdersTable;
