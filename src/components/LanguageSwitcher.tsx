
import { useTranslation } from "@/hooks/useTranslation";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { language, changeLanguage, availableLanguages } = useTranslation();

  const handleLanguageChange = (newLanguage: string) => {
    changeLanguage(newLanguage);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 p-1.5 rounded bg-black/20 hover:bg-black/30 transition-colors">
        <Languages className="h-4 w-4" />
        <span className="text-xs font-medium uppercase">{language}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {availableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`text-sm ${lang.code === language ? 'font-bold' : ''}`}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
