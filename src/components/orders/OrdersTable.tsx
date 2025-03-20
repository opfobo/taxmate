
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, FileDown } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface OrdersTableProps {
  orders: any[];
  isLoading: boolean;
  onViewDetails: (order: any) => void;
  orderType: string;
}

const OrdersTable = ({ orders, isLoading, onViewDetails, orderType }: OrdersTableProps) => {
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "accepted":
        return "bg-blue-500";
      case "processing":
        return "bg-purple-500";
      case "shipped":
        return "bg-orange-500";
      case "delivered":
        return "bg-green-500";
      case "declined":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>{t("loading")}</p>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="py-8 text-center">
        <p>{t("no_orders")}</p>
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
            <TableHead>{orderType === "fulfillment" ? t("customer") : t("supplier")}</TableHead>
            <TableHead>{t("total_price")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.order_number}</TableCell>
              <TableCell>{format(new Date(order.order_date), "PPP")}</TableCell>
              <TableCell>
                {orderType === "supplier" 
                  ? (order.supplier?.name || "-") 
                  : "-"}
              </TableCell>
              <TableCell>
                {new Intl.NumberFormat("de-DE", {
                  style: "currency",
                  currency: order.currency || "EUR",
                }).format(order.total_price)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`${getStatusColor(order.status)} text-white`}>
                  {t(order.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetails(order)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t("view")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    <FileDown className="h-4 w-4 mr-1" />
                    {t("download_invoice")}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersTable;
