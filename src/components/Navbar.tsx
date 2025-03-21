
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, LogOut, FileText, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <nav className="border-b">
      <div className="container flex items-center justify-between py-4">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold">
          TaxMate
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className={`hover:underline ${location.pathname === "/dashboard" ? "font-semibold" : ""}`}>
            {t("dashboard")}
          </Link>
          <Link to="/orders" className={`hover:underline ${location.pathname === "/orders" ? "font-semibold" : ""}`}>
            {t("orders")}
          </Link>
          <Link to="/tax-reports" className={`hover:underline ${location.pathname === "/tax-reports" ? "font-semibold" : ""}`}>
            {t("tax_reports")}
          </Link>
          <Link to="/transactions" className={`hover:underline ${location.pathname === "/transactions" ? "font-semibold" : ""}`}>
            {t("transactions")}
          </Link>
          <Link to="/resources" className={`hover:underline ${location.pathname === "/resources" ? "font-semibold" : ""}`}>
            {t("resources")}
          </Link>
        </div>

        {/* User Profile / Login */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {user.email || t("profile")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <FileText className="h-4 w-4 mr-2" />
                    {t("profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    {t("settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link to="/auth/login">{t("login")}</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
