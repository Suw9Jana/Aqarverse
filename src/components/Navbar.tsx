import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { User } from "lucide-react";
import logo from "@/assets/aqarverse_logo.jpg";

export const Navbar = () => {
  const { t } = useLanguage();
  // Mock logged in state - in real app, this would come from auth context
  const isLoggedIn = false; // Set to true to see customer profile button
  
  return (
    <nav className="border-b bg-card sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/partners" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src={logo} alt="AqarVerse" className="h-14 w-14 object-contain" />
          <span className="text-xl font-bold text-primary">AqarVerse</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          {isLoggedIn ? (
            <Link to="/profile/edit">
              <Button variant="ghost">
                <User className="h-4 w-4 mr-2" />
                {t("profile")}
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">{t("login")}</Button>
              </Link>
              <Link to="/register">
                <Button>{t("register")}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
