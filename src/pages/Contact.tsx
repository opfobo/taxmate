
import { useTranslation } from "@/hooks/useTranslation";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Zap, Mail, Phone, MapPin } from "lucide-react";

const Contact = () => {
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
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tighter mb-8 text-center">
              {t("contact_title")}
            </h1>
            
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div>
                <h2 className="text-2xl font-semibold mb-6">{t("contact_form_title")}</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      {t("contact_form_name")}
                    </label>
                    <Input
                      id="name"
                      className={`bg-black/10 border-white/20 ${theme === "dark-navy" ? "focus:border-blue-500" : "focus:border-red-500"}`}
                      placeholder={t("contact_form_name_placeholder")}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      {t("contact_form_email")}
                    </label>
                    <Input
                      id="email"
                      type="email"
                      className="bg-black/10 border-white/20"
                      placeholder={t("contact_form_email_placeholder")}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-1">
                      {t("contact_form_subject")}
                    </label>
                    <Input
                      id="subject"
                      className="bg-black/10 border-white/20"
                      placeholder={t("contact_form_subject_placeholder")}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1">
                      {t("contact_form_message")}
                    </label>
                    <Textarea
                      id="message"
                      className="bg-black/10 border-white/20 min-h-[120px]"
                      placeholder={t("contact_form_message_placeholder")}
                    />
                  </div>
                  
                  <Button 
                    className={`w-full ${
                      theme === "dark-navy" 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {t("contact_form_submit")}
                  </Button>
                </div>
              </div>
              
              <div className="bg-black/20 p-6 rounded-lg">
                <h2 className="text-2xl font-semibold mb-6">{t("contact_info_title")}</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Mail className={`w-5 h-5 mt-1 mr-3 ${theme === "dark-navy" ? "text-blue-400" : "text-red-400"}`} />
                    <div>
                      <h3 className="font-medium">{t("contact_email")}</h3>
                      <p className="text-gray-300">info@taxmate.example</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className={`w-5 h-5 mt-1 mr-3 ${theme === "dark-navy" ? "text-blue-400" : "text-red-400"}`} />
                    <div>
                      <h3 className="font-medium">{t("contact_phone")}</h3>
                      <p className="text-gray-300">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className={`w-5 h-5 mt-1 mr-3 ${theme === "dark-navy" ? "text-blue-400" : "text-red-400"}`} />
                    <div>
                      <h3 className="font-medium">{t("contact_address")}</h3>
                      <p className="text-gray-300">
                        123 Tax Street<br />
                        Accounting Tower, Floor 45<br />
                        Finance City, 10001
                      </p>
                    </div>
                  </div>
                </div>
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

export default Contact;
