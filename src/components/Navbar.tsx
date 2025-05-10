
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose 
} from "@/components/ui/sheet";
import { 
  User, 
  LogOut,
  Menu,
  LayoutDashboard,
  Settings,
  FileBarChart,
  BookOpen,
  ChartBar,
  ShoppingBag,
  ScanLine,
  GitBranch,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

const Navbar = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth/login");
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navLinks = [
    {
      to: "/dashboard",
      label: t("dashboard"),
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      to: "/dashboard/orders",
      label: t("orders"),
      icon: <ShoppingBag className="h-5 w-5" />
    },
    {
      to: "/orderflow",
      label: t("menu.orderFlow"),
      icon: <GitBranch className="h-5 w-5" />
    },
    {
      to: "/scouting", // New scouting link
      label: "Scouting",
      icon: <Search className="h-5 w-5" />
    },
    {
      to: "/dashboard/ocr",
      label: t("ocr.title"),
      icon: <ScanLine className="h-5 w-5" />
    },
    {
      to: "/dashboard/tax-reports",
      label: t("tax_reports"),
      icon: <FileBarChart className="h-5 w-5" />
    },
    {
      to: "/dashboard/analytics",
      label: t("analytics"),
      icon: <ChartBar className="h-5 w-5" />
    },
    {
      to: "/dashboard/resources",
      label: t("resources"),
      icon: <BookOpen className="h-5 w-5" />
    },
  ];

  const NavLinks = () => (
    <>
      {navLinks.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={`flex items-center gap-2 px-3 py-2 transition-colors hover:text-primary ${
            location.pathname.startsWith(link.to) 
              ? "font-medium text-primary" 
              : "text-muted-foreground"
          }`}
        >
          {link.icon}
          <span>{link.label}</span>
        </Link>
      ))}
      
      {/* Added logout button below navigation items for sidebar/desktop */}
      {user && !isMobile && (
        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-2 px-3 py-2 transition-colors hover:text-destructive text-muted-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span>{t("logout")}</span>
        </button>
      )}
    </>
  );

  const MobileNav = () => (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[250px] flex-col">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-left text-xl font-bold">
            TaxMate
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col space-y-1 py-4">
          <NavLinks />
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t pt-4">
          <ThemeToggle />
          <LanguageSwitcher />
          {user ? (
            <>
              <Button variant="outline" asChild className="justify-start">
                <Link to="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("profile")}
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link to="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {t("settings")}
                </Link>
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="justify-start"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("logout")}
              </Button>
            </>
          ) : (
            <Button asChild className="w-full">
              <Link to="/auth/login">{t("login")}</Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center text-xl font-bold">
            TaxMate
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-6">
          <NavLinks />
        </nav>

        {/* Right side: User & Toggles */}
        <div className="flex items-center gap-2">
          {/* Theme & Language on desktop */}
          <div className="hidden md:flex md:items-center md:gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>

          {/* User Menu on desktop */}
          {!isMobile && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span className="hidden md:inline-block">
                    {user.email || t("profile")}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    {t("profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    {t("settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Login button (desktop, when logged out) */}
          {!isMobile && !user && (
            <Button asChild>
              <Link to="/auth/login">{t("login")}</Link>
            </Button>
          )}

          {/* Mobile menu button */}
          <MobileNav />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
