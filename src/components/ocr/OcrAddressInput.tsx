
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Check, AlertCircle, CheckCircle } from "lucide-react";

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

interface ValidationErrors {
  full_name?: string;
  address_line1?: string;
  postal_code?: string;
  city?: string;
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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [parseStats, setParseStats] = useState<{total: number, found: number}>({ total: 0, found: 0 });
  const [parseError, setParseError] = useState<string | null>(null);

  // Reset errors when address text changes
  useEffect(() => {
    if (addressText) {
      setValidationErrors({});
      setParseError(null);
    }
  }, [addressText]);

  const validateAddress = (address: ParsedAddress): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    if (!address.full_name || address.full_name.trim() === "") {
      errors.full_name = t("ocr.error_required_field");
    }
    
    if (!address.address_line1 || address.address_line1.trim() === "") {
      errors.address_line1 = t("ocr.error_required_field");
    }
    
    if (!address.postal_code || address.postal_code.trim() === "") {
      errors.postal_code = t("ocr.error_required_field");
    } else if (!/^\d{4,6}$/.test(address.postal_code.trim())) {
      errors.postal_code = t("ocr.error_invalid_postal_code");
    }
    
    if (!address.city || address.city.trim() === "") {
      errors.city = t("ocr.error_required_field");
    }
    
    if (!address.country || address.country.trim() === "") {
      errors.country = t("ocr.error_required_field");
    }
    
    return errors;
  };

  const parseAddress = async () => {
    if (!addressText.trim()) {
      toast({
        title: t("ocr.error"),
        description: t("ocr.empty_address_error"),
        variant: "destructive",
      });
      setParseError(t("ocr.empty_address_error"));
      return;
    }

    setIsProcessing(true);
    setParseError(null);
    
    try {
      // Enhanced address parsing logic
      const lines = addressText.split('\n').filter(line => line.trim());
      
      // Extract name (assume first line is name)
      const full_name = lines[0]?.trim() || "";
      
      // Extract postal code and city using multiple pattern matching
      let postal_code = "";
      let city = "";
      let country = "";
      let region = "";
      
      // Try to find postal code and city in the same line (several patterns)
      const postalCityRegexes = [
        /(\d{4,6})[\s,]+(.+)/,  // Basic format: 12345 City
        /(.+)[\s,]+(\d{4,6})/,  // Reverse format: City 12345
        /(\d{4,6})[\s\-]+(\d{1,4})[\s,]+(.+)/ // Extended format: 12345-678 City
      ];
      
      let postalCityLine = null;
      let postalCityMatch = null;
      
      // Try each regex pattern on each line
      for (const line of lines) {
        for (const regex of postalCityRegexes) {
          const match = line.match(regex);
          if (match) {
            postalCityLine = line;
            postalCityMatch = match;
            
            if (regex === postalCityRegexes[0]) {
              postal_code = match[1];
              city = match[2].trim();
            } else if (regex === postalCityRegexes[1]) {
              city = match[1].trim();
              postal_code = match[2];
            } else if (regex === postalCityRegexes[2]) {
              postal_code = match[1];
              city = match[3].trim();
            }
            break;
          }
        }
        if (postalCityMatch) break;
      }
      
      // Look for known country names in the last lines (expanded list)
      const commonCountries = [
        'Germany', 'Deutschland', 'France', 'Frankreich', 'Italy', 'Italien', 
        'Spain', 'Spanien', 'UK', 'United Kingdom', 'USA', 'United States',
        'Austria', 'Österreich', 'Switzerland', 'Schweiz', 'Netherlands', 
        'Niederlande', 'Belgium', 'Belgien', 'Denmark', 'Dänemark'
      ];
      
      for (const line of lines.slice(Math.max(0, lines.length - 3))) {
        for (const countryName of commonCountries) {
          if (line.toLowerCase().includes(countryName.toLowerCase())) {
            country = countryName;
            break;
          }
        }
        if (country) break;
      }
      
      // Address lines (exclude name, postal/city line, and country line)
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
      
      // Calculate parsing stats
      const totalFields = 5; // name, address, postal code, city, country
      let foundFields = 0;
      if (parsed.full_name) foundFields++;
      if (parsed.address_line1) foundFields++;
      if (parsed.postal_code) foundFields++;
      if (parsed.city) foundFields++;
      if (parsed.country) foundFields++;
      
      setParseStats({
        total: totalFields,
        found: foundFields
      });
      
      setParsedAddress(parsed);
      
      // Validate the parsed address
      const errors = validateAddress(parsed);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        const missingFieldsMsg = Object.keys(errors).join(", ");
        setParseError(t("ocr.incomplete_parse_error", { fields: missingFieldsMsg }));
      } else {
        toast({
          title: t("ocr.success"),
          description: t("ocr.address_parsed_successfully"),
        });
      }
    } catch (error) {
      console.error("Error parsing address:", error);
      toast({
        title: t("ocr.error"),
        description: t("ocr.address_parse_error"),
        variant: "destructive",
      });
      setParseError(t("ocr.address_parse_error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const createConsumer = async () => {
    if (!user || !parsedAddress) return;
    
    // Final validation before saving
    const errors = validateAddress(parsedAddress);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: t("ocr.validation_error"),
        description: t("ocr.fix_validation_errors"),
        variant: "destructive",
      });
      return;
    }
    
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
      {parseError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("ocr.parse_error_title")}</AlertTitle>
          <AlertDescription>
            {parseError}
          </AlertDescription>
        </Alert>
      )}
      
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
      
      {/* Parsing stats info alert */}
      {parseStats.found > 0 && (
        <Alert className={parseStats.found === parseStats.total ? "bg-muted/30 border-green-200" : "bg-muted/30"}>
          {parseStats.found === parseStats.total ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
          <AlertTitle>
            {parseStats.found === parseStats.total 
              ? t("ocr.parse_complete") 
              : t("ocr.parse_incomplete")}
          </AlertTitle>
          <AlertDescription>
            {t("ocr.parse_stats", { found: parseStats.found, total: parseStats.total })}
          </AlertDescription>
        </Alert>
      )}
      
      {parsedAddress && (
        <div className="mt-6 border rounded-md p-4 bg-muted/30">
          <h3 className="font-medium mb-2">{t("ocr.parsed_results")}</h3>
          
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium">{t("ocr.name")}</p>
              <p className="text-sm">{parsedAddress.full_name || "-"}</p>
              {validationErrors.full_name && (
                <p className="text-xs text-destructive mt-1">{validationErrors.full_name}</p>
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium">{t("ocr.address")}</p>
              <p className="text-sm">{parsedAddress.address_line1 || "-"}</p>
              {parsedAddress.address_line2 && (
                <p className="text-sm">{parsedAddress.address_line2}</p>
              )}
              {validationErrors.address_line1 && (
                <p className="text-xs text-destructive mt-1">{validationErrors.address_line1}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm font-medium">{t("ocr.postal_code")}</p>
                <p className="text-sm">{parsedAddress.postal_code || "-"}</p>
                {validationErrors.postal_code && (
                  <p className="text-xs text-destructive mt-1">{validationErrors.postal_code}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{t("ocr.city")}</p>
                <p className="text-sm">{parsedAddress.city || "-"}</p>
                {validationErrors.city && (
                  <p className="text-xs text-destructive mt-1">{validationErrors.city}</p>
                )}
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
                {validationErrors.country && (
                  <p className="text-xs text-destructive mt-1">{validationErrors.country}</p>
                )}
              </div>
            </div>
          </div>
          
          <Button 
            onClick={createConsumer} 
            disabled={isCreating || Object.keys(validationErrors).length > 0} 
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
