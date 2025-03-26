
import { useTranslation } from "@/hooks/useTranslation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConsumerWithOrderStats } from "@/types/consumer";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface ConsumersTableProps {
  consumers: ConsumerWithOrderStats[];
  isLoading?: boolean;
  onConsumerSelect: (consumer: ConsumerWithOrderStats) => void;
}

const ConsumersTable = ({ consumers, isLoading, onConsumerSelect }: ConsumersTableProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (consumers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t("no_consumers_found")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("name")}</TableHead>
            <TableHead>{t("email")}</TableHead>
            <TableHead>{t("phone")}</TableHead>
            <TableHead>{t("location")}</TableHead>
            <TableHead>{t("since")}</TableHead>
            <TableHead>{t("orders")}</TableHead>
            <TableHead>{t("order_volume")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {consumers.map((consumer) => (
            <TableRow key={consumer.id}>
              <TableCell className="font-medium">
                {consumer.full_name}
              </TableCell>
              <TableCell>{consumer.email || "-"}</TableCell>
              <TableCell>{consumer.phone || "-"}</TableCell>
              <TableCell>
                {[consumer.city, consumer.postal_code, consumer.country]
                  .filter(Boolean)
                  .join(", ") || "-"}
              </TableCell>
              <TableCell>
                {consumer.created_at 
                  ? format(new Date(consumer.created_at), "PP") 
                  : "-"}
              </TableCell>
              <TableCell>
                {consumer.total_orders || 0}
              </TableCell>
              <TableCell>
                {consumer.total_order_volume 
                  ? formatCurrency(consumer.total_order_volume) 
                  : "-"}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onConsumerSelect(consumer)}
                >
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

export default ConsumersTable;
