import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ImageIcon, Info } from "lucide-react";

interface OrdersTableProps {
  orders: any[];
  isLoading: boolean;
  onViewDetails: (order: any) => void;
  orderType: string;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, isLoading, onViewDetails, orderType }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
        {t("loading_orders")}
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        {t("no_orders")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("order_number")}</TableHead>
            <TableHead>{t("order_date")}</TableHead>
            <TableHead>{t("total_price")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("supplier")}</TableHead>
            <TableHead>{t("images")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.order_number}</TableCell>
              <TableCell>{format(new Date(order.order_date), "yyyy-MM-dd")}</TableCell>
              <TableCell>
                {order.total_price} {order.currency}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {t(order.status)}
                </Badge>
              </TableCell>
              <TableCell>{order?.supplier?.name || "-"}</TableCell>
              <TableCell>
                {order.image_url ? (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(order)}
                  className="flex items-center gap-1"
                >
                  <Info className="h-4 w-4" />
                  {t("view_details")}
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
