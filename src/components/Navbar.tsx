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
      <div className="container mx-auto px-4">
        {/* استخدمنا Grid بثلاث أعمدة حتى يكون البراند في المنتصف والكنترولز يمين */}
        <div className="grid grid-cols-3 items-center py-4 md:py-5">
          {/* عمود يسار (فارغ/احتياطي لو احتجته لاحقًا) */}
          <div className="justify-self-start" />

          {/* الوسط: اللوجو بالنصف والاسم تحته */}
          <Link
            to="/partners"
            className="justify-self-center flex flex-col items-center gap-1 hover:opacity-90 transition-opacity"
          >
            <img
              src={logo}
              alt="AqarVerse"
              className="h-20 w-20 md:h-24 md:w-24 object-contain"
            />
            <span className="text-lg md:text-xl font-bold text-primary">AqarVerse</span>
          </Link>

          {/* يمين: أزرار اللغة/الثيم وتسجيل الدخول/الملف */}
          <div className="justify-self-end flex items-center gap-2">
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
      </div>
    </nav>
  );
};
