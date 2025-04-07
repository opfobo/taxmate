
import { useTranslation } from "@/hooks/useTranslation";
import AddressParser from "@/components/ocr/AddressParser";

const ConsumerOcrTab = () => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <AddressParser />
    </div>
  );
};

export default ConsumerOcrTab;
