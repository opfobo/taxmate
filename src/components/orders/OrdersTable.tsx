
import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2 } from "lucide-react";
import Image from "@/components/Image";

type Order = {
  id: string;
  order_number: string;
  order_date: string;
  status: string;
  amount: number;
  currency: string;
  supplier?: { name: string; id: string; };
  image_urls?: string[];
  image_url?: string;
  notes?: string;
};

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  onViewDetails: (order: Order) => void;
  orderType: "fulfillment" | "supplier";
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  isLoading,
  onViewDetails,
  orderType
}) => {
  const { t } = useTranslation();

  // Helper to get the first image URL from various possible sources
  const getFirstImageUrl = (order: Order): string | undefined => {
    // If image_urls array exists, use its first item
    if (Array.isArray(order.image_urls) && order.image_urls.length > 0) {
      return order.image_urls[0];
    }
    
    // If image_url exists, use it
    if (order.image_url) {
      return order.image_url;
    }
    
    // If notes contains encoded image URLs in JSON format
    if (order.notes && order.notes.startsWith('{') && order.notes.includes('imageUrls')) {
      try {
        const parsedNotes = JSON.parse(order.notes);
        if (Array.isArray(parsedNotes.imageUrls) && parsedNotes.imageUrls.length > 0) {
          return parsedNotes.imageUrls[0];
        }
      } catch (error) {
        console.error("Error parsing notes JSON:", error);
      }
    }
    
    return undefined;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t("no_orders_found")}</p>
      </div>
    );
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
            <TableHead>{t("date")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("amount")}</TableHead>
            {orderType === "supplier" && <TableHead>{t("supplier")}</TableHead>}
            <TableHead>{t("image")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.order_number}</TableCell>
              <TableCell>
                {order.order_date && format(new Date(order.order_date), "PP")}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(order.status || "pending")}>
                  {t(order.status || "pending")}
                </Badge>
              </TableCell>
              <TableCell>
                {order.amount} {order.currency || "EUR"}
              </TableCell>
              {orderType === "supplier" && (
                <TableCell>
                  {order.supplier?.name || <span className="text-muted-foreground">-</span>}
                </TableCell>
              )}
              <TableCell>
                {getFirstImageUrl(order) ? (
                  <Image 
                    src={getFirstImageUrl(order)!} 
                    alt={`${t("order")} ${order.order_number}`} 
                    className="h-8 w-8 rounded object-cover" 
                  />
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onViewDetails(order)}
                >
                  <Eye className="h-4 w-4" />
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
