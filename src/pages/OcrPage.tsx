
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import OcrUpload from "@/components/ocr/OcrUpload";
import OcrAddressInput from "@/components/ocr/OcrAddressInput";

const formSchema = z.object({
  ocrToken: z.string().min(1, {
    message: "OCR Token is required."
  }),
});

const OcrPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [ocrToken, setOcrToken] = useState("");
  const [activeTab, setActiveTab] = useState("invoice");
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ocrToken: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setOcrToken(values.ocrToken);

    // Simulate a delay to show the loading state
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Check if the OCR token is valid (replace with your actual validation logic)
    if (values.ocrToken === "valid_token") {
      navigate("/ocr/upload");
    } else {
      toast({
        title: t("error"),
        description: t("ocr_token_check_failed"),
        variant: "destructive"
      });
    }

    setIsLoading(false);
  }

  const handleOcrResult = (result: any) => {
    console.log("OCR result received:", result);
    // Additional handling can be added here
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-center">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>{t("ocr_integration")}</CardTitle>
            <CardDescription>
              {t("ocr_integration_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="invoice" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="invoice">{t("invoice_ocr")}</TabsTrigger>
                <TabsTrigger value="consumer">{t("consumer_ocr")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="invoice" className="space-y-4">
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">{t("upload_invoice")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t("upload_invoice_description")}
                  </p>
                  
                  <OcrUpload 
                    onOcrResult={handleOcrResult} 
                    label={t("upload_invoice_for_ocr")}
                    mimeTypes={["application/pdf", "image/jpeg", "image/png"]}
                    fileSizeLimitMB={10}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="consumer" className="space-y-4">
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">{t("extract_consumer_address")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t("extract_consumer_address_description")}
                  </p>
                  
                  <OcrAddressInput />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OcrPage;
