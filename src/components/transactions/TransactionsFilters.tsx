
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { DateRange } from "react-day-picker";
import { Search } from "lucide-react";
import DateRangePicker from "@/components/orders/DateRangePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusFilter from "@/components/transactions/StatusFilter";

interface TransactionsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string | null;
  onStatusChange: (status: string | null) => void;
  typeFilter: string | null;
  onTypeChange: (type: string | null) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

const TransactionsFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  dateRange,
  onDateRangeChange
}: TransactionsFiltersProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      {/* Search filter */}
      <div className="flex-grow relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("search_transactions")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status filter */}
      <StatusFilter 
        value={statusFilter}
        onChange={onStatusChange}
        statusOptions={["matched", "unmatched", "success", "pending", "failed"]}
      />

      {/* Type filter */}
      <Select value={typeFilter || "all"} onValueChange={(value) => onTypeChange(value === "all" ? null : value)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={t("type")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("all_types")}</SelectItem>
          <SelectItem value="purchase">{t("purchase")}</SelectItem>
          <SelectItem value="refund">{t("refund")}</SelectItem>
          <SelectItem value="payout">{t("payout")}</SelectItem>
        </SelectContent>
      </Select>

      {/* Date range filter */}
      <DateRangePicker
        value={dateRange || { from: undefined, to: undefined }}
        onChange={onDateRangeChange}
      />
    </div>
  );
};

export default TransactionsFilters;
