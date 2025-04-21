
import { useTranslation } from "@/hooks/useTranslation";
import OcrUpload from "@/components/ocr/OcrUpload";
import { useNavigate } from "react-router-dom";

const InvoiceOcrTab = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <OcrUpload 
        onOcrResult={(result) => {
          if (result?.id) {
            navigate(`/dashboard/ocr/review/${result.id}`);
          }
        }}
        label={t("ocr.invoice_placeholder_title")}
      />
    </div>
  );
};

export default InvoiceOcrTab;
