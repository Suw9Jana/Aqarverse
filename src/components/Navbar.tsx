import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { User, LogOut } from "lucide-react";
import logo from "@/assets/aqarverse_logo.jpg";

/* Firebase */
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export const Navbar = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<string | null>(null);

  // Listen to Firebase Auth state + detect role
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        try {
          const companyDoc = await getDoc(doc(db, "company", u.uid));
          if (companyDoc.exists()) {
            setRole("company");
            return;
          }

          const customerDoc = await getDoc(doc(db, "Customer", u.uid));
          if (customerDoc.exists()) {
            setRole("customer");
            return;
          }

          setRole(null);
        } catch {
          setRole(null);
        }
      } else {
        setRole(null);
      }
    });

    return () => unsub();
  }, []);

  // Logout with toast
  const handleLogout = async () => {
    try {
      await signOut(auth);

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
        duration: 10000, // 10 seconds
      });

      navigate("/partners");
    } catch (err: any) {
      toast({
        title: "Logout failed",
        description: err?.message || "Could not log out.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="border-b bg-card sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 items-center py-4 md:py-5">

          {/* Left empty space */}
          <div className="justify-self-start" />

          {/* Center Logo */}
          <Link
            to="/partners"
            className="justify-self-center flex flex-col items-center gap-1 hover:opacity-90 transition-opacity"
          >
            <img
              src={logo}
              alt="AqarVerse"
              className="h-20 w-20 md:h-24 md:w-24 object-contain"
            />
            <span className="text-lg md:text-xl font-bold text-primary">
              AqarVerse
            </span>
          </Link>

          {/* Right Side: User + Toggles */}
          <div className="justify-self-end flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />

            {user ? (
              <>
                {role === "company" && (
                  <Button variant="ghost" onClick={() => navigate("/dashboard/company")}>
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                )}

                {role === "customer" && (
                  <Button variant="ghost" onClick={() => navigate("/dashboard/customer")}>
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                )}

                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("logout") || "Logout"}
                </Button>
              </>
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
