import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/aqarverse-logo.jpeg";

export const Navbar = () => {
  const { t } = useLanguage();
  
  return (
    <nav className="border-b bg-card sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/partners" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src={logo} alt="AqarVerse" className="h-10 w-10 object-contain" />
          <span className="text-xl font-bold text-primary">AqarVerse</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost">{t("login")}</Button>
          </Link>
          <Link to="/register">
            <Button>{t("register")}</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
