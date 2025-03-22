
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { DateRange } from "react-day-picker";
import { Search } from "lucide-react";
import DateRangePicker from "@/components/orders/DateRangePicker";
import StatusFilter from "@/components/transactions/StatusFilter";

interface TransactionsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string | null;
  onStatusChange: (status: string | null) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

const TransactionsFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateRange,
  onDateRangeChange
}: TransactionsFiltersProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Search filter */}
      <div className="flex-grow relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("search_transactions")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status filter */}
      <StatusFilter value={statusFilter} onChange={onStatusChange} />

      {/* Date range filter */}
      <DateRangePicker
        value={dateRange || { from: undefined, to: undefined }}
        onChange={onDateRangeChange}
      />
    </div>
  );
};

export default TransactionsFilters;
