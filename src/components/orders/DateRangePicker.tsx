import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
  value: { from: Date | undefined; to: Date | undefined };
  onChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
};

const DateRangePicker = ({ value, onChange }: Props) => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const handleSelect = (range: { from: Date; to?: Date }) => {
    onChange(range);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[250px] justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value.from ? (
            value.to ? (
              <>
                {format(value.from, "dd.MM.yyyy")} - {format(value.to, "dd.MM.yyyy")}
              </>
            ) : (
              format(value.from, "dd.MM.yyyy")
            )
          ) : (
            <span>{t("select_date_range")}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
