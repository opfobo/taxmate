import { useTranslation } from "@/hooks/useTranslation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  value: string | null;
  onChange: (value: string | null) => void;
};

const StatusFilter = ({ value, onChange }: Props) => {
  const { t } = useTranslation();

  const statuses = [
    "pending",
    "accepted",
    "declined",
    "processing",
    "shipped",
    "delivered",
  ];

  return (
    <Select value={value || ""} onValueChange={(val) => onChange(val || null)}>
      <SelectTrigger className="min-w-[160px]">
        <SelectValue placeholder={t("filter_status")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">{t("all_statuses")}</SelectItem>
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
