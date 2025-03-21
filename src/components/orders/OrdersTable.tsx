import { useTranslation } from "@/hooks/useTranslation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type OrdersTableProps = {
  orders: any[];
  isLoading: boolean;
  onViewDetails: (order: any) => void;
  orderType: "fulfillment" | "supplier";
};

const OrdersTable = ({ orders, isLoading, onViewDetails }: OrdersTableProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!orders.length) {
    return <p className="text-muted-foreground text-center py-6">{t("no_orders")}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("order_number")}</TableHead>
            <TableHead>{t("order_date")}</TableHead>
            <TableHead>{t("total_price")}</TableHead>
            <TableHead>{t("currency")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("supplier")}</TableHead>
            <TableHead>{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.order_number}</TableCell>
              <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
              <TableCell>{order.total_price?.toFixed(2)}</TableCell>
              <TableCell>{order.currency}</TableCell>
              <TableCell className="capitalize">{t(order.status)}</TableCell>
              <TableCell>{order.supplier?.name || "-"}</TableCell>
              <TableCell>
                <Button size="sm" onClick={() => onViewDetails(order)}>
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
