
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "@/hooks/useTranslation";

interface Supplier {
  id: string;
  name: string;
  order_count: number;
  total_spend: number;
  currency: string;
}

interface SupplierTableProps {
  suppliers: Supplier[];
  currency?: string;
}

const SupplierTable = ({ suppliers, currency = "EUR" }: SupplierTableProps) => {
  const { t } = useTranslation();

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("supplier_name")}</TableHead>
            <TableHead className="text-right">{t("number_of_orders")}</TableHead>
            <TableHead className="text-right">{t("total_spend")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center">
                {t("no_suppliers_found")}
              </TableCell>
            </TableRow>
          ) : (
            suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell className="text-right">{supplier.order_count}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(supplier.total_spend, supplier.currency || currency)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default SupplierTable;
