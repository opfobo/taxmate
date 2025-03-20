
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";

interface StatusFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

const StatusFilter = ({ value, onChange }: StatusFilterProps) => {
  const { t } = useTranslation();

  const handleChange = (value: string) => {
    if (value === "all") {
      onChange(null);
    } else {
      onChange(value);
    }
  };

  return (
    <Select
      value={value || "all"}
      onValueChange={handleChange}
    >
      <SelectTrigger className="w-40">
        <SelectValue placeholder={t("status")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("all_statuses")}</SelectItem>
        <SelectItem value="pending">{t("pending")}</SelectItem>
        <SelectItem value="accepted">{t("accepted")}</SelectItem>
        <SelectItem value="processing">{t("processing")}</SelectItem>
        <SelectItem value="shipped">{t("shipped")}</SelectItem>
        <SelectItem value="delivered">{t("delivered")}</SelectItem>
        <SelectItem value="declined">{t("declined")}</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default StatusFilter;
