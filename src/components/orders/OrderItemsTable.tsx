import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "@/components/Image";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url?: string;
}

interface OrderItemsTableProps {
  items: OrderItem[];
}

const OrderItemsTable: React.FC<OrderItemsTableProps> = ({ items }) => {
  const { t } = useTranslation();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("product_name")}</TableHead>
          <TableHead>{t("quantity")}</TableHead>
          <TableHead>{t("unit_price")}</TableHead>
          <TableHead>{t("total_price")}</TableHead>
          <TableHead>{t("upload_image")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.product_name}</TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>{item.unit_price.toFixed(2)}</TableCell>
            <TableCell>{item.total_price.toFixed(2)}</TableCell>
            <TableCell>
              {item.image_url ? (
                <Image src={item.image_url} alt={item.product_name} className="h-10 w-10 object-cover" />
              ) : (
                <span className="text-muted-foreground">{t("no_image")}</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default OrderItemsTable;
