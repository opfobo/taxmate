
import { useTranslation } from "@/hooks/useTranslation";

const ConsumerOcrTab = () => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t("ocr.consumer_placeholder_title")}</h2>
      <p className="text-muted-foreground">{t("ocr.consumer_placeholder_text")}</p>
    </div>
  );
};

export default ConsumerOcrTab;
