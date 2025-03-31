
import { PageLayout } from "@/components/PageLayout";
import { useTranslation } from "@/hooks/useTranslation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Users } from "lucide-react";
import OcrUpload from "@/components/ocr/OcrUpload";
import OcrAddressInput from "@/components/ocr/OcrAddressInput";

const OcrPage = () => {
  const { t } = useTranslation();

  return (
    <PageLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">{t("ocr.title")}</h1>
        
        <Tabs defaultValue="invoice" className="w-full mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invoice" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("ocr.invoice_tab")}
            </TabsTrigger>
            <TabsTrigger value="consumer" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("ocr.consumer_tab")}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="invoice" className="mt-6">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">{t("ocr.invoice_title")}</h2>
              <p className="text-muted-foreground mb-6">{t("ocr.invoice_description")}</p>
              <OcrUpload 
                onOcrResult={() => {}} 
                label={t("ocr.upload_document")}
                mimeTypes={["application/pdf", "image/jpeg", "image/png"]}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="consumer" className="mt-6">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">{t("ocr.consumer_title")}</h2>
              <p className="text-muted-foreground mb-6">{t("ocr.consumer_description")}</p>
              <OcrAddressInput />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default OcrPage;
