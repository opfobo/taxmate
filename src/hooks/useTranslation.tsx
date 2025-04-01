import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type TranslationType = {
  [key: string]: string;
};

export function useTranslation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [translations, setTranslations] = useState<Record<string, TranslationType>>({});
  const [language, setLanguage] = useState<string>(() => {
    const savedLanguage = localStorage.getItem("app-language");
    return savedLanguage || "en";
  });

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from("translations").select("*");

        if (error) {
          console.error("Error fetching translations:", error);
          toast({
            title: "Translation Error",
            description: "Failed to load translations. Some text may appear in English only.",
            variant: "destructive",
          });
          return;
        }

        if (data) {
          const formatted: Record<string, TranslationType> = {};
          data.forEach((item: any) => {
            formatted[item.key] = {
              en: item.en,
              de: item.de,
              ru: item.ru,
            };
          });
          setTranslations(formatted);
        }
      } catch (error) {
        console.error("Unexpected error fetching translations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, [toast]);

  useEffect(() => {
    const syncWithUserProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("language")
            .eq("id", user.id)
            .single();

          if (error) {
            console.error("Error fetching user language preference:", error);
            return;
          }

          if (data?.language) {
            setLanguage(data.language);
            localStorage.setItem("app-language", data.language);
          }
        } catch (error) {
          console.error("Error syncing with user profile:", error);
        }
      }
    };

    syncWithUserProfile();
  }, [user]);

  const changeLanguage = async (newLanguage: string) => {
    if (newLanguage === language) return;
    setLanguage(newLanguage);
    localStorage.setItem("app-language", newLanguage);

    if (user) {
      try {
        const { error } = await supabase
          .from("users")
          .update({
            language: newLanguage,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (error) {
          console.error("Error updating language preference:", error);
          toast({
            title: "Error",
            description: "Couldn't save your language preference to your profile.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Language Updated",
            description: `Language switched to ${getLanguageName(newLanguage)}`,
          });
        }
      } catch (error) {
        console.error("Error saving language preference:", error);
      }
    }
  };

  const getLanguageName = (langCode: string): string => {
    switch (langCode) {
      case "en": return "English";
      case "de": return "Deutsch";
      case "ru": return "Русский";
      default: return langCode;
    }
  };

  const t = (key: string): string => {
    if (isLoading || !translations[key]) return key;
    const translation = translations[key][language];
    return translation || translations[key].de || translations[key].en || key;
  };

  return {
    t,
    language,
    changeLanguage,
    isLoading,
    availableLanguages: [
      { code: "en", name: "English" },
      { code: "de", name: "Deutsch" },
      { code: "ru", name: "Русский" },
    ],
  };
}
