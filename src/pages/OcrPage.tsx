
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { useTranslation } from "@/hooks/useTranslation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Users, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import OcrUpload from "@/components/ocr/OcrUpload";
import OcrAddressInput from "@/components/ocr/OcrAddressInput";
import OcrSectionCard from "@/components/ocr/OcrSectionCard";

// Define explicit type for OCR tokens to avoid deep instantiation
interface OcrTokenData {
  user_id: string;
  tokens: number;
}

const OcrPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Get remaining OCR tokens
  const { data: ocrTokens } = useQuery<OcrTokenData | null, Error>({
    queryKey: ["ocr-tokens", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("ocr_tokens")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <PageLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">{t("ocr.title")}</h1>
        
        <Tabs defaultValue="invoice" className="w-full mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invoice" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("ocr.invoice_tab")}
              {ocrTokens && (
                <Badge variant="outline" className="ml-2">
                  {t("ocr.tokens_left_badge", { count: ocrTokens.tokens })}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="consumer" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("ocr.consumer_tab")}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="invoice" className="mt-6">
            <OcrSectionCard 
              title={t("ocr.invoice_title")}
              description={t("ocr.invoice_description")}
            >
              <OcrUpload 
                onOcrResult={() => {}} 
                label={t("ocr.upload_document")}
                mimeTypes={["application/pdf", "image/jpeg", "image/png"]}
              />
            </OcrSectionCard>
          </TabsContent>
          
          <TabsContent value="consumer" className="mt-6">
            <OcrSectionCard 
              title={t("ocr.consumer_title")}
              description={t("ocr.consumer_description")}
            >
              <OcrAddressInput />
            </OcrSectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default OcrPage;
