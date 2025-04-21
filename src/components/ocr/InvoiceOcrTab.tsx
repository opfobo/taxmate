
import { useTranslation } from "@/hooks/useTranslation";
import OcrUpload from "@/components/ocr/OcrUpload";
import { useNavigate } from "react-router-dom";

const InvoiceOcrTab = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <OcrUpload 
        onComplete={(result) => {
          if (result?.id) {
            navigate(`/dashboard/ocr/review/${result.id}`);
          }
        }}
        mode="invoice"
      />
    </div>
  );
};

export default InvoiceOcrTab;
