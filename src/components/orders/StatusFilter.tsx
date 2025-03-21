import { useTranslation } from "@/hooks/useTranslation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatusFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

const statusOptions = [
  "pending",
  "accepted",
  "declined",
  "processing",
  "shipped",
  "delivered",
];

const StatusFilter = ({ value, onChange }: StatusFilterProps) => {
  const { t } = useTranslation();

  return (
    <Select
      value={value || ""}
      onValueChange={(val) => onChange(val === "" ? null : val)}
    >
      <SelectTrigger className="min-w-[150px]">
        <SelectValue placeholder={t("status")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">{t("status")}</SelectItem>
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
