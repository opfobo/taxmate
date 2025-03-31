
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Check } from "lucide-react";

// Define explicit types to avoid deep type instantiation
interface ParsedAddress {
  full_name: string;
  address_line1: string;
  address_line2?: string;
  postal_code?: string;
  city?: string;
  region?: string;
  country?: string;
}

const OcrAddressInput = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addressText, setAddressText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedAddress, setParsedAddress] = useState<ParsedAddress | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const parseAddress = async () => {
    if (!addressText.trim()) {
      toast({
        title: t("ocr.error"),
        description: t("ocr.empty_address_error"),
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simple address parsing logic
      // In a real application, this would be more sophisticated or use an API
      const lines = addressText.split('\n').filter(line => line.trim());
      
      // Extract name (assume first line is name)
      const full_name = lines[0]?.trim() || "";
      
      // Extract postal code and city (look for pattern like "12345 City")
      let postal_code = "";
      let city = "";
      let country = "";
      let region = "";
      
      // Try to find postal code and city in the same line
      const postalCityLine = lines.find(line => 
        /\d{4,6}[\s,]+\w+/.test(line)
      );
      
      if (postalCityLine) {
        const match = postalCityLine.match(/(\d{4,6})[\s,]+(.+)/);
        if (match) {
          postal_code = match[1];
          city = match[2].trim();
        }
      }
      
      // Look for known country names in the last lines
      const commonCountries = ['Germany', 'Deutschland', 'France', 'Italy', 'Spain', 'UK', 'USA'];
      for (const line of lines.slice(Math.max(0, lines.length - 2))) {
        const countryMatch = commonCountries.find(c => 
          line.toLowerCase().includes(c.toLowerCase())
        );
        if (countryMatch) {
          country = countryMatch;
          break;
        }
      }
      
      // Address lines (excluding name, postal/city line, and country)
      const addressLines = lines.slice(1).filter(line => 
        line !== postalCityLine && 
        !commonCountries.some(c => line.toLowerCase().includes(c.toLowerCase()))
      );
      
      const address_line1 = addressLines[0]?.trim() || "";
      const address_line2 = addressLines.slice(1).join(', ').trim() || undefined;
      
      // Create the parsed address object
      const parsed: ParsedAddress = {
        full_name,
        address_line1,
        ...(address_line2 ? { address_line2 } : {}),
        ...(postal_code ? { postal_code } : {}),
        ...(city ? { city } : {}),
        ...(region ? { region } : {}),
        ...(country ? { country } : {})
      };
      
      setParsedAddress(parsed);
      
      toast({
        title: t("ocr.success"),
        description: t("ocr.address_parsed_successfully"),
      });
    } catch (error) {
      console.error("Error parsing address:", error);
      toast({
        title: t("ocr.error"),
        description: t("ocr.address_parse_error"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const createConsumer = async () => {
    if (!user || !parsedAddress) return;
    
    setIsCreating(true);
    
    try {
      // Type-safe insertion with explicitly defined data shape
      const { data: consumer, error } = await supabase
        .from('consumers')
        .insert({
          user_id: user.id,
          full_name: parsedAddress.full_name,
          address_line1: parsedAddress.address_line1,
          ...(parsedAddress.address_line2 ? { address_line2: parsedAddress.address_line2 } : {}),
          ...(parsedAddress.postal_code ? { postal_code: parsedAddress.postal_code } : {}),
          ...(parsedAddress.city ? { city: parsedAddress.city } : {}),
          ...(parsedAddress.region ? { region: parsedAddress.region } : {}),
          ...(parsedAddress.country ? { country: parsedAddress.country } : {})
        })
        .select('id')
        .single();

      if (error) throw error;
      
      toast({
        title: t("ocr.success"),
        description: t("ocr.consumer_created_successfully"),
      });
      
      navigate("/dashboard/orders/consumers");
    } catch (error: any) {
      console.error("Error creating consumer:", error);
      toast({
        title: t("ocr.error"),
        description: t("ocr.consumer_creation_error"),
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Textarea
          value={addressText}
          onChange={(e) => setAddressText(e.target.value)}
          placeholder={t("ocr.paste_address_placeholder")}
          className="h-32 resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t("ocr.address_paste_hint")}
        </p>
      </div>
      
      <Button 
        onClick={parseAddress} 
        disabled={isProcessing || !addressText.trim()} 
        className="w-full sm:w-auto"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("ocr.processing")}
          </>
        ) : (
          t("ocr.parse_address")
        )}
      </Button>
      
      {parsedAddress && (
        <div className="mt-6 border rounded-md p-4 bg-muted/30">
          <h3 className="font-medium mb-2">{t("ocr.parsed_results")}</h3>
          
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium">{t("ocr.name")}</p>
              <p className="text-sm">{parsedAddress.full_name || "-"}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium">{t("ocr.address")}</p>
              <p className="text-sm">{parsedAddress.address_line1 || "-"}</p>
              {parsedAddress.address_line2 && (
                <p className="text-sm">{parsedAddress.address_line2}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm font-medium">{t("ocr.postal_code")}</p>
                <p className="text-sm">{parsedAddress.postal_code || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">{t("ocr.city")}</p>
                <p className="text-sm">{parsedAddress.city || "-"}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm font-medium">{t("ocr.region")}</p>
                <p className="text-sm">{parsedAddress.region || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">{t("ocr.country")}</p>
                <p className="text-sm">{parsedAddress.country || "-"}</p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={createConsumer} 
            disabled={isCreating} 
            className="mt-4 w-full"
            variant="default"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("ocr.creating_consumer")}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {t("ocr.consumer_confirm_button")}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default OcrAddressInput;
