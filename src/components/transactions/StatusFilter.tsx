
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";

interface StatusFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
  statusOptions?: string[];
  placeholder?: string;
  allLabel?: string;
  width?: string;
}

const StatusFilter = ({ 
  value, 
  onChange, 
  statusOptions = ["success", "pending", "failed"],
  placeholder,
  allLabel,
  width = "w-[160px]"
}: StatusFilterProps) => {
  const { t } = useTranslation();
  
  return (
    <Select
      value={value || "all"}
      onValueChange={(val) => onChange(val === "all" ? null : val)}
    >
      <SelectTrigger className={width}>
        <SelectValue placeholder={placeholder || t("status")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel || t("all_statuses")}</SelectItem>
        {statusOptions.map((status) => (
          <SelectItem key={status} value={status}>
            {t(status)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default StatusFilter;
