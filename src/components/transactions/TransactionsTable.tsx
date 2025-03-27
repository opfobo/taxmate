
import { useTranslation } from "@/hooks/useTranslation";
import { Transaction } from "@/pages/TransactionsPage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Edit2, Trash2, ExternalLink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Link } from "react-router-dom";

interface TransactionsTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

const TransactionsTable = ({ transactions, onEdit, onDelete }: TransactionsTableProps) => {
  const { t } = useTranslation();

  // Function to format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency || "EUR",
    }).format(amount);
  };

  // Function to render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "success":
      case "matched":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t(status)}</Badge>;
      case "pending":
      case "unmatched":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{t(status)}</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{t(status)}</Badge>;
      default:
        return <Badge variant="outline">{t(status)}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("transaction_id")}</TableHead>
            <TableHead>{t("date")}</TableHead>
            <TableHead>{t("amount")}</TableHead>
            <TableHead>{t("type")}</TableHead>
            <TableHead>{t("payment_method")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("order")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-mono">
                {transaction.id.substring(0, 8)}...
              </TableCell>
              <TableCell>
                {format(new Date(transaction.created_at), "PP")}
              </TableCell>
              <TableCell>
                {formatCurrency(transaction.amount, transaction.currency)}
              </TableCell>
              <TableCell className="capitalize">
                {t(transaction.type)}
              </TableCell>
              <TableCell>
                {transaction.payment_method || "-"}
              </TableCell>
              <TableCell>
                {renderStatusBadge(transaction.status)}
              </TableCell>
              <TableCell>
                {transaction.order_number ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{transaction.order_number}</span>
                    <Link
                      to={`/dashboard/orders/${transaction.order_id}`}
                      className="text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(transaction)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("confirm_delete")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("delete_transaction_confirmation")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(transaction.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t("delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionsTable;
