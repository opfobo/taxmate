
import { useTranslation } from "@/hooks/useTranslation";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

const Impressum = () => {
  const { t } = useTranslation();
  const [theme] = useState<"dark-navy" | "dark-cherry">("dark-navy");

  return (
    <div 
      className={`min-h-screen flex flex-col ${
        theme === "dark-navy" 
          ? "bg-slate-900 text-white" 
          : "bg-red-950 text-white"
      } transition-colors duration-300`}
    >
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-sm bg-black/10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={`h-6 w-6 ${theme === "dark-navy" ? "text-blue-500" : "text-red-500"}`} />
            <Link to="/" className="text-xl font-bold">TaxMate</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container px-4 md:px-6 py-20">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tighter mb-8">
              {t("impressum_title")}
            </h1>
            
            <div className="prose prose-invert max-w-none space-y-8">
              <div>
                <h2 className="text-2xl font-semibold">{t("impressum_company_title")}</h2>
                <p className="mt-4 text-gray-300">{t("impressum_company_text")}</p>
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold">{t("impressum_address_title")}</h2>
                <p className="mt-4 text-gray-300">{t("impressum_address_text")}</p>
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold">{t("impressum_contact_title")}</h2>
                <p className="mt-4 text-gray-300">{t("impressum_contact_text")}</p>
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold">{t("impressum_register_title")}</h2>
                <p className="mt-4 text-gray-300">{t("impressum_register_text")}</p>
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold">{t("impressum_disclaimer_title")}</h2>
                <p className="mt-4 text-gray-300">{t("impressum_disclaimer_text")}</p>
              </div>
            </div>
            
            <div className="mt-12 border-t border-white/10 pt-4">
              <Link to="/" className={`text-sm ${theme === "dark-navy" ? "text-blue-400" : "text-red-400"} hover:underline`}>
                &larr; {t("back_to_home")}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 md:py-0">
        <div className="container flex flex-col-reverse items-center justify-between gap-4 py-6 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-gray-400 md:text-left">
              &copy; {new Date().getFullYear()} TaxMate. {t("all_rights_reserved")}
            </p>
          </div>
          <div className="flex gap-4">
            <Link to="/privacy" className="text-sm text-gray-400 hover:text-white">
              {t("privacy_policy")}
            </Link>
            <Link to="/impressum" className="text-sm text-gray-400 hover:text-white">
              {t("impressum")}
            </Link>
            <Link to="/contact" className="text-sm text-gray-400 hover:text-white">
              {t("contact_us")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Impressum;
