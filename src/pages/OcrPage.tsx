
import { useTranslation } from "@/hooks/useTranslation";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import InvoiceOcrTab from "@/components/ocr/InvoiceOcrTab";
import ConsumerOcrTab from "@/components/ocr/ConsumerOcrTab";
import { FileText, User } from "lucide-react";

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
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t("ocr.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("ocr.subtitle")}</p>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="invoice" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("ocr.invoice_tab")}
            </TabsTrigger>
            <TabsTrigger value="consumer" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("ocr.consumer_tab")}
            </TabsTrigger>
          </TabsList>
          
          <Card>
            <CardHeader className="pb-2 border-b">
              <CardTitle>{t("ocr.documents")}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <TabsContent value="invoice" className="mt-0">
                <InvoiceOcrTab />
              </TabsContent>
              
              <TabsContent value="consumer" className="mt-0">
                <ConsumerOcrTab />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default OcrPage;
