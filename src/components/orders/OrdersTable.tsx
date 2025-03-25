
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
import { Eye, Loader2, Pencil } from "lucide-react";
import ImagePreview from "@/components/orders/ImagePreview";
import { cn } from "@/lib/utils";

type Order = {
  id: string;
  order_number: string;
  order_date: string;
  status: string;
  amount: number;
  currency: string;
  supplier?: { name: string; id: string; };
  image_url?: string;
  notes?: string;
  order_items?: { id: string }[];
};

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  onViewDetails: (order: Order) => void;
  onEditOrder?: (order: Order) => void;
  orderType: "fulfillment" | "supplier";
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  isLoading,
  onViewDetails,
  onEditOrder,
  orderType
}) => {
  const { t } = useTranslation();

  // Helper to get all image URLs from various possible sources
  const getImageUrls = (order: Order): string[] => {
    const urls: string[] = [];
    
    // If image_url exists, include it
    if (order.image_url) {
      urls.push(order.image_url);
    }
    
    // If notes contains encoded image URLs in JSON format
    if (order.notes && order.notes.startsWith('{') && order.notes.includes('imageUrls')) {
      try {
        const parsedNotes = JSON.parse(order.notes);
        if (Array.isArray(parsedNotes.imageUrls)) {
          urls.push(...parsedNotes.imageUrls);
        }
      } catch (error) {
        console.error("Error parsing notes JSON:", error);
      }
    }
    
    return urls;
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
    switch (status.toLowerCase()) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing": return "bg-blue-100 text-blue-800 border-blue-200";
      case "shipped": return "bg-purple-100 text-purple-800 border-purple-200";
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "canceled": return "bg-red-100 text-red-800 border-red-200";
      case "accepted": return "bg-blue-100 text-blue-800 border-blue-200";
      case "declined": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
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
            <TableHead>{t("images")}</TableHead>
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
                <Badge className={cn("px-2 py-1", getStatusColor(order.status || "pending"))}>
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
                <ImagePreview 
                  imageUrls={getImageUrls(order)}
                  alt={`${t("order")} ${order.order_number}`}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onViewDetails(order)}
                    title={t("view_details")}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {onEditOrder && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEditOrder(order)}
                      title={t("edit_order")}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
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
