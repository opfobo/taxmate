
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { MenuIcon, X, User, Settings } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="hidden sm:inline-block">TaxMaster</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:gap-4">
          <ThemeToggle />
          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link to="/dashboard">{t("dashboard")}</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{t("profile")}</span>
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>{t("settings")}</span>
                </Link>
              </Button>
              <Button onClick={handleSignOut}>{t("logout")}</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth/login">{t("login")}</Link>
              </Button>
              <Button asChild>
                <Link to="/auth/signup">{t("sign_up")}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Navigation Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={t("toggle_menu")}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <MenuIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="container pb-4 md:hidden">
          <div className="flex flex-col space-y-3">
            {user ? (
              <>
                <Button variant="ghost" asChild className="justify-start">
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    {t("dashboard")}
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="justify-start">
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{t("profile")}</span>
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="justify-start">
                  <Link to="/settings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>{t("settings")}</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                >
                  {t("logout")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="justify-start">
                  <Link to="/auth/login" onClick={() => setIsMenuOpen(false)}>
                    {t("login")}
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="justify-start">
                  <Link to="/auth/signup" onClick={() => setIsMenuOpen(false)}>
                    {t("sign_up")}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
