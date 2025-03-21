
import { useTranslation } from "@/hooks/useTranslation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type OrdersTableProps = {
  orders: any[];
  isLoading: boolean;
  onViewDetails: (order: any) => void;
  orderType: "fulfillment" | "supplier";
};

const OrdersTable = ({ orders, isLoading, onViewDetails, orderType }: OrdersTableProps) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-blue-100 text-blue-800";
      case "declined": return "bg-red-100 text-red-800";
      case "processing": return "bg-purple-100 text-purple-800";
      case "shipped": return "bg-indigo-100 text-indigo-800";
      case "delivered": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("order_number")}</TableHead>
            <TableHead>{t("order_date")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("total_price")}</TableHead>
            <TableHead>{t("currency")}</TableHead>
            {orderType === "supplier" && <TableHead>{t("supplier")}</TableHead>}
            <TableHead>{t("items")}</TableHead>
            <TableHead>{t("notes")}</TableHead>
            <TableHead>{t("images")}</TableHead>
            <TableHead>{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.order_number}</TableCell>
              <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(order.status)}>
                  {t(order.status)}
                </Badge>
              </TableCell>
              <TableCell>{order.amount?.toFixed(2)}</TableCell>
              <TableCell>{order.currency}</TableCell>
              {orderType === "supplier" && (
                <TableCell>{order.supplier?.name || "-"}</TableCell>
              )}
              <TableCell>
                {order.order_items?.length ? (
                  <Badge variant="outline">
                    {order.order_items.length}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">0</span>
                )}
              </TableCell>
              <TableCell>
                {order.notes ? (
                  <span className="line-clamp-1 max-w-[150px]">{order.notes}</span>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                {order.image_urls?.length > 0 || order.image_url ? (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Image className="h-3 w-3" />
                    {order.image_urls?.length || 
                     (typeof order.image_url === 'string' && order.image_url.includes(',') 
                      ? order.image_url.split(',').length 
                      : order.image_url ? '1' : '0')}
                  </Badge>
                ) : "-"}
              </TableCell>
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
