
import { useTranslation } from "@/hooks/useTranslation";
import OcrUpload from "@/components/ocr/OcrUpload";

const InvoiceOcrTab = () => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <OcrUpload 
        onOcrResult={(result) => console.log("OCR Result:", result)}
        label={t("ocr.invoice_placeholder_title")}
      />
    </div>
  );
};

export default InvoiceOcrTab;
