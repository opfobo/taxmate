
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ReloadIcon } from "@radix-ui/react-icons";
import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-center">
        <Card className="w-[500px]">
          <CardHeader>
            <CardTitle>{t("ocr_integration")}</CardTitle>
            <CardDescription>
              {t("ocr_integration_description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ocrToken">{t("ocr_token")}</Label>
                <Input
                  id="ocrToken"
                  type="text"
                  placeholder={t("enter_ocr_token")}
                  {...form.register("ocrToken")}
                />
              </div>
              <Button disabled={isLoading}>
                {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                {t("continue")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OcrPage;
