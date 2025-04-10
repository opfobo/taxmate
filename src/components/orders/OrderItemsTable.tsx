
import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "@/components/common/Image";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url?: string;
  supplier?: {
    name: string;
  };
}

interface OrderItemsTableProps {
  items: OrderItem[];
  onViewItem: (item: OrderItem) => void;
}

const OrderItemsTable: React.FC<OrderItemsTableProps> = ({ items, onViewItem }) => {
  const { t } = useTranslation();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("product_name")}</TableHead>
          <TableHead>{t("quantity")}</TableHead>
          <TableHead>{t("unit_price")}</TableHead>
          <TableHead>{t("total_price")}</TableHead>
          <TableHead>{t("supplier")}</TableHead>
          <TableHead>{t("image")}</TableHead>
          <TableHead>{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
              {t("no_items")}
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.product_name}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{item.unit_price.toFixed(2)}</TableCell>
              <TableCell>{item.total_price.toFixed(2)}</TableCell>
              <TableCell>
                {item.supplier?.name || <span className="text-muted-foreground">-</span>}
              </TableCell>
              <TableCell>
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.product_name} className="h-10 w-10 object-cover rounded" />
                ) : (
                  <span className="text-muted-foreground">{t("no_image")}</span>
                )}
              </TableCell>
              <TableCell>
                <Button size="sm" variant="ghost" onClick={() => onViewItem(item)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default OrderItemsTable;
