
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";

interface StatusFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

const StatusFilter = ({ value, onChange }: StatusFilterProps) => {
  const { t } = useTranslation();
  
  // List of transaction statuses
  const statuses = [
    "success",
    "pending", 
    "failed"
  ];

  return (
    <Select
      value={value || "all"}
      onValueChange={(val) => onChange(val === "all" ? null : val)}
    >
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder={t("status")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("all_statuses")}</SelectItem>
        {statuses.map((status) => (
          <SelectItem key={status} value={status}>
            {t(status)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default StatusFilter;
