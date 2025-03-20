
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

const LandingPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container">
        <section className="py-20 md:py-32">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              {t("landing_title")}
            </h1>
            <p className="mt-6 max-w-[700px] text-muted-foreground md:text-xl">
              {t("landing_subtitle")}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {user ? (
                <Button size="lg" asChild>
                  <Link to="/dashboard">{t("go_to_dashboard")}</Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link to="/auth/signup">{t("sign_up")}</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/auth/login">{t("login")}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-xl font-bold">{t("tax_management")}</h3>
              <p className="text-muted-foreground mt-2">
                {t("tax_management_desc")}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-xl font-bold">{t("business_insights")}</h3>
              <p className="text-muted-foreground mt-2">
                {t("business_insights_desc")}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-xl font-bold">{t("document_management")}</h3>
              <p className="text-muted-foreground mt-2">
                {t("document_management_desc")}
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} TaxMaster. {t("all_rights_reserved")}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
