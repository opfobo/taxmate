
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const OcrLayout = () => {
  const { t } = useTranslation();
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
  
  return (
    <PageLayout>
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t("ocr.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("ocr.subtitle")}</p>
        </div>

        <Card>
          <CardHeader className="border-b px-6">
            <CardTitle>{t("ocr.documents")}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs 
              value={getActiveTab()}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="mb-6">
                <TabsTrigger value="invoice">
                  {t("ocr.invoice_tab")}
                </TabsTrigger>
                <TabsTrigger value="consumer">
                  {t("ocr.consumer_tab")}
                </TabsTrigger>
              </TabsList>
              
              <Outlet />
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default OcrLayout;
