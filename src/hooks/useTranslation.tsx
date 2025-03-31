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
    // First try to get from localStorage
    const savedLanguage = localStorage.getItem("app-language");
    if (savedLanguage) return savedLanguage;
    
    // Default to 'en'
    return "en";
  });

  // Fetch all translations on component mount
  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("translations")
          .select("*");

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
          // Transform the data into a more usable format
          const formattedTranslations: Record<string, TranslationType> = {};
          
          data.forEach((item: any) => {
            formattedTranslations[item.key] = {
              en: item.en,
              de: item.de,
              ru: item.ru,
            };
          });
          
          setTranslations(formattedTranslations);
        }
      } catch (error) {
        console.error("Unexpected error fetching translations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, [toast]);

  // Sync with user profile when user changes
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

          if (data && data.language) {
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

  // Function to change the language
  const changeLanguage = async (newLanguage: string) => {
    if (newLanguage === language) return;

    // Update the local state and localStorage
    setLanguage(newLanguage);
    localStorage.setItem("app-language", newLanguage);

    // Update user profile in Supabase if logged in
    if (user) {
      try {
        const { error } = await supabase
          .from("users")
          .update({ 
            language: newLanguage,
            updated_at: new Date().toISOString()
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

  // Helper function to get language name
  const getLanguageName = (langCode: string): string => {
    switch (langCode) {
      case "en": return "English";
      case "de": return "Deutsch";
      case "ru": return "Русский";
      default: return langCode;
    }
  };

  // The translation function
  const t = (key: string): string => {
    // If translations aren't loaded yet, return the key
    if (isLoading || !translations[key]) {
      return key;
    }

    // Try to get the translation in the current language
    const translation = translations[key][language];

    // If translation exists in current language, return it
    if (translation) {
      return translation;
    }

    // Fallback to German if no translation in current language
    if (translations[key].de) {
      return translations[key].de;
    }

    // Fallback to English if no German translation
    if (translations[key].en) {
      return translations[key].en;
    }

    // If all else fails, return the key
    return key;
  };

  return {
    t,
    language,
    changeLanguage,
    isLoading,
    availableLanguages: [
      { code: "en", name: "English" },
      { code: "de", name: "Deutsch" },
      { code: "ru", name: "Русский" }
    ]
  };
}
