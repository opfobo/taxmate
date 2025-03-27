
import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, RefreshCw } from "lucide-react";

interface TransactionsSummaryProps {
  purchases: number;
  refunds: number;
  payouts: number;
  total: number;
  currency: string;
}

const TransactionsSummary = ({ purchases, refunds, payouts, total, currency }: TransactionsSummaryProps) => {
  const { t } = useTranslation();

  const formatter = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  });

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("total_purchases")}
          </CardTitle>
          <ArrowUpIcon className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatter.format(purchases)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("total_refunds")}
          </CardTitle>
          <ArrowDownIcon className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatter.format(refunds)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("total_payouts")}
          </CardTitle>
          <RefreshCw className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatter.format(payouts)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("net_total")}
          </CardTitle>
          <div className={`h-4 w-4 rounded-full ${total >= 0 ? "bg-green-500" : "bg-destructive"}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatter.format(total)}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsSummary;
