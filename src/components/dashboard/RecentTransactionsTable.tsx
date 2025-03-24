
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  payment_method: string;
  type: string;
  status: string;
}

interface RecentTransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const RecentTransactionsTable = ({ transactions, isLoading }: RecentTransactionsTableProps) => {
  const { t } = useTranslation();

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatTransactionId = (id: string) => {
    return id.substring(0, 8) + "...";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t(status)}</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{t(status)}</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{t(status)}</Badge>;
      default:
        return <Badge variant="outline">{t(status || "unknown")}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t("no_transactions_found")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("transaction_id")}</TableHead>
            <TableHead>{t("date")}</TableHead>
            <TableHead>{t("amount")}</TableHead>
            <TableHead>{t("payment_method")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-mono">{formatTransactionId(transaction.id)}</TableCell>
              <TableCell>
                {format(new Date(transaction.created_at), "PP")}
              </TableCell>
              <TableCell>
                {formatCurrency(transaction.amount, transaction.currency)}
              </TableCell>
              <TableCell>
                {transaction.payment_method || t("not_specified")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RecentTransactionsTable;
