
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/common/PageLayout";
import { useTranslation } from "@/hooks/useTranslation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, User } from "lucide-react";

const OcrLayout = () => {
  const {
    t
  } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab based on path
  const getActiveTab = () => {
    if (location.pathname.includes("/consumer")) {
      return "consumer";
    }
    return "invoice";
  };

  // Handle tab changes
  const handleTabChange = (value: string) => {
    if (value === "consumer") {
      navigate("/dashboard/ocr/consumer");
    } else {
      navigate("/dashboard/ocr/invoice");
    }
  };
  return <PageLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">{t("ocr.title")}</h1>
        
        <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="w-full mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invoice" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("ocr.invoice_tab")}
            </TabsTrigger>
            <TabsTrigger value="consumer" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("ocr.consumer_tab")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Outlet />
      </div>
    </PageLayout>;
};
export default OcrLayout;
