import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  BarChart3,
  Clock,
  CreditCard,
  FileText,
  LineChart,
  Moon,
  PieChart,
  Rocket,
  ShieldCheck,
  Sun,
  TrendingUp,
  Zap
} from "lucide-react";

const LandingPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [theme, setTheme] = useState<"dark-navy" | "dark-cherry">("dark-navy");

  const toggleTheme = () => {
    setTheme(theme === "dark-navy" ? "dark-cherry" : "dark-navy");
  };

  const features = [
    {
      icon: <FileText className="h-10 w-10" />,
      title: t("feature_1_title"),
      description: t("feature_1_desc")
    },
    {
      icon: <TrendingUp className="h-10 w-10" />,
      title: t("feature_2_title"),
      description: t("feature_2_desc")
    },
    {
      icon: <BarChart3 className="h-10 w-10" />,
      title: t("feature_3_title"),
      description: t("feature_3_desc")
    },
    {
      icon: <ShieldCheck className="h-10 w-10" />,
      title: t("feature_4_title"),
      description: t("feature_4_desc")
    }
  ];

  const steps = [
    {
      icon: <Clock className="h-8 w-8" />,
      title: t("step_1_title"),
      description: t("step_1_desc")
    },
    {
      icon: <LineChart className="h-8 w-8" />,
      title: t("step_2_title"),
      description: t("step_2_desc")
    },
    {
      icon: <PieChart className="h-8 w-8" />,
      title: t("step_3_title"),
      description: t("step_3_desc")
    }
  ];

  const pricingPlans = [
    {
      name: t("pricing_free"),
      price: "$0",
      period: t("per_month"),
      description: t("pricing_free_desc"),
      features: [
        t("pricing_free_feature_1"),
        t("pricing_free_feature_2"),
        t("pricing_free_feature_3")
      ],
      badge: null,
      buttonVariant: "outline"
    },
    {
      name: t("pricing_starter"),
      price: "$29",
      period: t("per_month"),
      description: t("pricing_starter_desc"),
      features: [
        t("pricing_starter_feature_1"),
        t("pricing_starter_feature_2"),
        t("pricing_starter_feature_3"),
        t("pricing_starter_feature_4")
      ],
      badge: t("most_popular"),
      buttonVariant: "default"
    },
    {
      name: t("pricing_pro"),
      price: "$79",
      period: t("per_month"),
      description: t("pricing_pro_desc"),
      features: [
        t("pricing_pro_feature_1"),
        t("pricing_pro_feature_2"),
        t("pricing_pro_feature_3"),
        t("pricing_pro_feature_4"),
        t("pricing_pro_feature_5")
      ],
      badge: null,
      buttonVariant: "outline"
    }
  ];

  const testimonials = [
    {
      quote: t("testimonial_1_quote"),
      author: t("testimonial_1_author"),
      role: t("testimonial_1_role")
    },
    {
      quote: t("testimonial_2_quote"),
      author: t("testimonial_2_author"),
      role: t("testimonial_2_role")
    }
  ];

  return (
    <div
      className={`min-h-screen flex flex-col ${
        theme === "dark-navy"
          ? "bg-slate-900 text-white"
          : "bg-red-950 text-white"
      } transition-colors duration-300`}
    >
      {/* Theme + Language Switcher */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-3 py-2 rounded-lg bg-black/30 backdrop-blur-md border border-white/10 shadow-md">
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-blue-300" />
          <Switch
            checked={theme === "dark-cherry"}
            onCheckedChange={toggleTheme}
            className={`${
              theme === "dark-cherry" ? "bg-red-700" : "bg-blue-900"
            }`}
          />
          <Sun className="h-4 w-4 text-red-300" />
        </div>
        <LanguageSwitcher />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-sm bg-black/10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap
              className={`h-6 w-6 ${
                theme === "dark-navy" ? "text-blue-500" : "text-red-500"
              }`}
            />
            <span className="text-xl font-bold">TaxMate</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <a href="#features" className="text-sm hover:text-primary transition-colors">
              {t("features")}
            </a>
            <a href="#how-it-works" className="text-sm hover:text-primary transition-colors">
              {t("how_it_works")}
            </a>
            <a href="#testimonials" className="text-sm hover:text-primary transition-colors">
              {t("testimonials")}
            </a>
            <a href="#pricing" className="text-sm hover:text-primary transition-colors">
              {t("pricing")}
            </a>
          </nav>
          <div>
            {user ? (
              <Button size="sm" asChild>
                <Link to="/dashboard">{t("go_to_dashboard")}</Link>
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="border-white/20 hover:bg-white/10"
                >
                  <Link to="/auth/login">{t("login")}</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className={
                    theme === "dark-navy"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-red-600 hover:bg-red-700"
                  }
                >
                  <Link to="/auth/signup">{t("sign_up")}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hier geht dein restlicher Main-Inhalt weiter... */}
      {/* ... */}

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 md:py-0">
        <div className="container flex flex-col-reverse items-center justify-between gap-4 py-6 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-gray-400 md:text-left">
              &copy; {new Date().getFullYear()} TaxMate. {t("all_rights_reserved")}
            </p>
          </div>
          <div className="flex gap-4">
            <Link to="/Privacy" className="text-sm text-gray-400 hover:text-white">
              {t("privacy_policy")}
            </Link>
            <Link to="/Impressum" className="text-sm text-gray-400 hover:text-white">
              {t("terms_of_service")}
            </Link>
            <Link to="/Contact" className="text-sm text-gray-400 hover:text-white">
              {t("contact_us")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
