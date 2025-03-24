
import { useTranslation } from "@/hooks/useTranslation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shopper } from "@/types/shopper";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ShoppersTableProps {
  shoppers: Shopper[];
  isLoading: boolean;
  onShopperSelect: (shopper: Shopper) => void;
}

const ShoppersTable = ({ shoppers, isLoading, onShopperSelect }: ShoppersTableProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (shoppers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t("no_shoppers_found")}</p>
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
            <TableHead>{t("location")}</TableHead>
            <TableHead>{t("since")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shoppers.map((shopper) => (
            <TableRow key={shopper.id}>
              <TableCell className="font-medium">
                {shopper.salutation && `${shopper.salutation} `}
                {shopper.first_name} {shopper.last_name}
              </TableCell>
              <TableCell>{shopper.email || "-"}</TableCell>
              <TableCell>
                {[shopper.city, shopper.region, shopper.country]
                  .filter(Boolean)
                  .join(", ") || "-"}
              </TableCell>
              <TableCell>
                {shopper.created_at 
                  ? format(new Date(shopper.created_at), "PP") 
                  : "-"}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onShopperSelect(shopper)}
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

export default ShoppersTable;
