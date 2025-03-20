
import { useTranslation } from "@/hooks/useTranslation";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSwitcher() {
  const { language, changeLanguage, availableLanguages } = useTranslation();

  const handleLanguageChange = (newLanguage: string) => {
    changeLanguage(newLanguage);
    // Force page reload to update all translations
    window.location.reload();
  };

  return (
    <Select
      value={language}
      onValueChange={handleLanguageChange}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {availableLanguages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
