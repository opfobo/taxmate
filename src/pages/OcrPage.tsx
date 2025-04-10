
import { useTranslation } from "@/hooks/useTranslation";
import { PageLayout } from "@/components/common/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import InvoiceOcrTab from "@/components/ocr/InvoiceOcrTab";
import ConsumerOcrTab from "@/components/ocr/ConsumerOcrTab";

const OcrPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("invoice");

  // Handle tab changes from URL
  useEffect(() => {
    const pathParts = location.pathname.split("/");
    const lastPart = pathParts[pathParts.length - 1];
    
    if (lastPart === "consumer") {
      setActiveTab("consumer");
    } else {
      setActiveTab("invoice");
    }
  }, [location.pathname]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === "consumer") {
      navigate("/dashboard/ocr/consumer");
    } else {
      navigate("/dashboard/ocr/invoice");
    }
  };

  return (
    <PageLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">{t("ocr.title")}</h1>
        
        <Card>
          <CardContent className="p-6">
            <TabsContent value="invoice">
              <InvoiceOcrTab />
            </TabsContent>
            
            <TabsContent value="consumer">
              <ConsumerOcrTab />
            </TabsContent>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default OcrPage;
