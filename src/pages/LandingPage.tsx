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

  // Features array
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

  // Steps array
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

  // Pricing plans
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

  // Testimonials
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
      {/* Theme Switcher */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 p-2 rounded-full bg-black/20 backdrop-blur-sm">
        <Moon className="h-4 w-4 text-blue-300" />
        <Switch 
          checked={theme === "dark-cherry"} 
          onCheckedChange={toggleTheme} 
          className={`${theme === "dark-cherry" ? "bg-red-700" : "bg-blue-900"}`}
        />
        <Sun className="h-4 w-4 text-red-300" />
      </div>

      {/* Theme + Language Switcher */}
<div className="fixed top-4 right-4 z-50 flex items-center gap-3 p-2 rounded-full bg-black/20 backdrop-blur-sm">
  <Moon className="h-4 w-4 text-blue-300" />
  <Switch 
    checked={theme === "dark-cherry"} 
    onCheckedChange={toggleTheme} 
    className={`${theme === "dark-cherry" ? "bg-red-700" : "bg-blue-900"}`}
  />
  <Sun className="h-4 w-4 text-red-300" />
  <LanguageSwitcher />
</div>


      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-sm bg-black/10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={`h-6 w-6 ${theme === "dark-navy" ? "text-blue-500" : "text-red-500"}`} />
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
                  className={theme === "dark-navy" ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"}
                >
                  <Link to="/auth/signup">{t("sign_up")}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="inline-block rounded-full px-3 py-1 text-sm mb-4 
                bg-gradient-to-r from-gray-800 to-gray-700 text-white border border-white/10">
                {t("hero_badge")}
              </div>
              
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl max-w-3xl">
                {t("hero_title")}
                <span className={`block mt-2 ${
                  theme === "dark-navy" ? "text-blue-400" : "text-red-400"
                }`}>
                  {t("hero_subtitle")}
                </span>
              </h1>
              
              <p className="max-w-[700px] text-gray-300 md:text-xl mt-4">
                {t("hero_description")}
              </p>
              
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  className={`${
                    theme === "dark-navy" 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-red-600 hover:bg-red-700 text-white"
                  } transition-colors duration-200`}
                >
                  <Rocket className="mr-2 h-4 w-4" /> {t("get_started")}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white/20 bg-black/10 hover:bg-white/10 text-white"
                >
                  {t("learn_more")}
                </Button>
              </div>
              
              <div className="mt-12 relative w-full max-w-4xl">
                <div className={`absolute inset-0 blur-3xl opacity-30 rounded-xl ${
                  theme === "dark-navy" ? "bg-blue-500" : "bg-red-500"
                }`}></div>
                
                <AspectRatio 
                  ratio={16 / 9} 
                  className="overflow-hidden rounded-xl border border-white/10 shadow-xl bg-gray-950/50"
                >
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <CreditCard className={`h-16 w-16 mx-auto mb-4 ${
                        theme === "dark-navy" ? "text-blue-400" : "text-red-400"
                      }`} />
                      <p className="text-sm text-gray-400">{t("demo_placeholder")}</p>
                    </div>
                  </div>
                </AspectRatio>
              </div>
            </div>
          </div>
        </section>

       {/* Features Section */}
<section id="features" className="py-16 md:py-24 bg-black/20">
  <div className="container px-4 md:px-6">
    <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
      <div className={`inline-block p-1 rounded-full ${
        theme === "dark-navy" ? "bg-blue-900/20" : "bg-red-900/20"
      }`}>
        <div className={`rounded-full px-3 py-1 text-sm ${
          theme === "dark-navy" ? "bg-blue-900/30 text-blue-300" : "bg-red-900/30 text-red-300"
        }`}>
          {t("features")}
        </div>
      </div>
      <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
        {t("features_title")}
      </h2>
      <p className="max-w-[700px] text-gray-400 md:text-lg">
        {t("features_description")}
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
      {features.map((feature, index) => (
        <Card
          key={index}
          className={`border-white/5 ${
            theme === "dark-navy"
              ? "bg-gradient-to-br from-blue-800 to-slate-800"
              : "bg-gradient-to-br from-red-800 to-slate-800"
          } hover:shadow-xl transition-all duration-200 hover:-translate-y-1`}
        >
          <CardHeader>
            <div className={`p-2 w-14 h-14 rounded-lg mb-2 flex items-center justify-center ${
              theme === "dark-navy" ? "bg-blue-900/20 text-blue-400" : "bg-red-900/20 text-red-400"
            }`}>
              {feature.icon}
            </div>
            <CardTitle className={`text-xl font-semibold ${
              theme === "dark-navy" ? "text-blue-300 drop-shadow-sm" : "text-red-300 drop-shadow-sm"
            }`}>
              {feature.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-gray-400">
              {feature.description}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
</section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className={`inline-block p-1 rounded-full ${
                theme === "dark-navy" ? "bg-blue-900/20" : "bg-red-900/20"
              }`}>
                <div className={`rounded-full px-3 py-1 text-sm ${
                  theme === "dark-navy" ? "bg-blue-900/30 text-blue-300" : "bg-red-900/30 text-red-300"
                }`}>
                  {t("how_it_works")}
                </div>
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {t("how_it_works_title")}
              </h2>
              <p className="max-w-[700px] text-gray-400 md:text-lg">
                {t("how_it_works_description")}
              </p>
            </div>

            <div className="relative mt-12">
              {/* Desktop Steps - Horizontal */}
              <div className="hidden md:block">
                <div className={`absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 ${
                  theme === "dark-navy" ? "bg-blue-900/20" : "bg-red-900/20"
                }`}></div>
                
                <div className="grid grid-cols-3 gap-8 relative">
                  {steps.map((step, index) => (
                    <div key={index} className="flex flex-col items-center text-center">
                      <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                        theme === "dark-navy" 
                          ? "bg-blue-600 text-white" 
                          : "bg-red-600 text-white"
                      }`}>
                        {step.icon}
                        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center text-sm font-bold border-2 border-current">
                          {index + 1}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                      <p className="text-gray-400">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Steps - Vertical */}
              <div className="md:hidden space-y-8">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-start">
                    <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full mr-4 ${
                      theme === "dark-navy" 
                        ? "bg-blue-600 text-white" 
                        : "bg-red-600 text-white"
                    }`}>
                      <span className="font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center mb-2">
                        <div className={`mr-2 p-2 rounded-lg ${
                          theme === "dark-navy" ? "bg-blue-900/20 text-blue-400" : "bg-red-900/20 text-red-400"
                        }`}>
                          {step.icon}
                        </div>
                        <h3 className="text-xl font-bold">{step.title}</h3>
                      </div>
                      <p className="text-gray-400">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
<section id="testimonials" className="py-16 md:py-24 bg-black/20">
  <div className="container px-4 md:px-6">
    <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
      <div className={`inline-block p-1 rounded-full ${
        theme === "dark-navy" ? "bg-blue-900/20" : "bg-red-900/20"
      }`}>
        <div className={`rounded-full px-3 py-1 text-sm ${
          theme === "dark-navy" ? "bg-blue-900/30 text-blue-300" : "bg-red-900/30 text-red-300"
        }`}>
          {t("testimonials")}
        </div>
      </div>
      <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
        {t("testimonials_title")}
      </h2>
      <p className="max-w-[700px] text-gray-400 md:text-lg">
        {t("testimonials_description")}
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-8 mt-8">
      {testimonials.map((testimonial, index) => (
        <Card
          key={index}
          className={`border-white/5 ${
            theme === "dark-navy"
              ? "bg-gradient-to-br from-blue-950 to-slate-900"
              : "bg-gradient-to-br from-red-950 to-slate-900"
          }`}
        >
          <CardContent className="p-6">
            <div className={`mb-4 text-3xl ${
              theme === "dark-navy" ? "text-blue-400" : "text-red-400"
            }`}>
              ❝
            </div>
            <p className="text-lg mb-6 italic text-gray-100 drop-shadow">
              {testimonial.quote}
            </p>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white font-bold ${
                theme === "dark-navy" ? "bg-blue-800" : "bg-red-800"
              }`}>
                <span className="text-lg">
                  {testimonial.author.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-semibold text-white">{testimonial.author}</p>
                <p className="text-sm text-gray-300">{testimonial.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
</section>

        {/* Pricing Section */}
<section id="pricing" className="py-16 md:py-24">
  <div className="container px-4 md:px-6">
    <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
      <div className={`inline-block p-1 rounded-full ${
        theme === "dark-navy" ? "bg-blue-900/20" : "bg-red-900/20"
      }`}>
        <div className={`rounded-full px-3 py-1 text-sm ${
          theme === "dark-navy" ? "bg-blue-900/30 text-blue-300" : "bg-red-900/30 text-red-300"
        }`}>
          {t("pricing")}
        </div>
      </div>
      <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
        {t("pricing_title")}
      </h2>
      <p className="max-w-[700px] text-gray-400 md:text-lg">
        {t("pricing_description")}
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-8 mt-8">
      {pricingPlans.map((plan, index) => (
        <Card
          key={index}
          className={`border-white/5 relative ${
            plan.badge
              ? theme === "dark-navy"
                ? "border-blue-500/50"
                : "border-red-500/50"
              : ""
          } ${
            theme === "dark-navy"
              ? "bg-gradient-to-br from-blue-950 to-slate-900"
              : "bg-gradient-to-br from-red-950 to-slate-900"
          }`}
        >
          {plan.badge && (
            <Badge className={`absolute top-0 right-0 translate-x-1/4 -translate-y-1/3 ${
              theme === "dark-navy" ? "bg-blue-600" : "bg-red-600"
            }`}>
              {plan.badge}
            </Badge>
          )}
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white drop-shadow-sm">
              {plan.name}
            </CardTitle>
            <div className="mt-4 flex items-baseline text-white">
              <span className="text-4xl font-extrabold tracking-tight drop-shadow">
                {plan.price}
              </span>
              <span className="ml-1 text-sm font-medium text-gray-300">
                /{plan.period}
              </span>
            </div>
            <CardDescription className="mt-4 text-gray-300">
              {plan.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center">
                  <svg
                    className={`h-5 w-5 flex-shrink-0 ${
                      theme === "dark-navy" ? "text-blue-400" : "text-red-400"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-3 text-gray-200">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              className={`w-full mt-6 ${
                plan.buttonVariant === "default"
                  ? theme === "dark-navy"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-red-600 hover:bg-red-700"
                  : "border-white/20 bg-black/10 hover:bg-white/10"
              }`}
              variant={plan.buttonVariant as "default" | "outline"}
            >
              {t("get_started")}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
</section>

        {/* Final CTA Section */}
        <section className="py-16 md:py-24 bg-black/20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {t("cta_title")}
              </h2>
              <p className="text-gray-300 md:text-xl max-w-[700px]">
                {t("cta_description")}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  className={`${
                    theme === "dark-navy" 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {t("start_free_trial")}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white/20 bg-black/10 hover:bg-white/10"
                >
                  {t("contact_sales")}
                </Button>
              </div>
            </div>
          </div>
        </section>
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
        {t("terms_of_service")}
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

export default LandingPage;
