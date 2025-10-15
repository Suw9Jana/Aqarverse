import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navbar
    login: "Login",
    register: "Register",
    
    // Hero Section
    poweredBy: "Powered by Virtual Reality Technology",
    welcomeTitle: "Welcome to AqarVerse",
    welcomeDescription: "Bridging the future of real estate with immersive virtual experiences. We connect leading property companies to the metaverse, transforming how people explore, experience, and engage with properties in stunning 3D environments.",
    
    // Partners Section
    trustedPartners: "Our Trusted Partners",
    partnersDescription: "Discover our network of premium real estate companies pioneering the virtual property experience",
    searchPlaceholder: "Search by company name or city...",
    noResults: "No companies found matching your search.",
    loadMore: "Load More",
    
    // Footer
    companyDescription: "Your trusted partner in real estate solutions across Saudi Arabia.",
    quickLinks: "Quick Links",
    partners: "Partners",
    services: "Services",
    propertyManagement: "Property Management",
    realEstateConsulting: "Real Estate Consulting",
    investmentAdvisory: "Investment Advisory",
    contactUs: "Contact Us",
    email: "info@aqarverse.com",
    phone: "+966 XX XXX XXXX",
    location: "Riyadh, Saudi Arabia",
    rightsReserved: "Aqarverse. All rights reserved.",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
  },
  ar: {
    // Navbar
    login: "تسجيل الدخول",
    register: "التسجيل",
    
    // Hero Section
    poweredBy: "مدعوم بتقنية الواقع الافتراضي",
    welcomeTitle: "مرحباً بك في عقار فيرس",
    welcomeDescription: "نربط مستقبل العقارات بتجارب افتراضية غامرة. نحن نربط شركات العقارات الرائدة بالميتافيرس، ونحول كيفية استكشاف الناس للعقارات وتجربتها والتفاعل معها في بيئات ثلاثية الأبعاد مذهلة.",
    
    // Partners Section
    trustedPartners: "شركاؤنا الموثوقون",
    partnersDescription: "اكتشف شبكتنا من شركات العقارات المتميزة الرائدة في تجربة العقارات الافتراضية",
    searchPlaceholder: "ابحث باسم الشركة أو المدينة...",
    noResults: "لم يتم العثور على شركات تطابق بحثك.",
    loadMore: "تحميل المزيد",
    
    // Footer
    companyDescription: "شريكك الموثوق في حلول العقارات في جميع أنحاء المملكة العربية السعودية.",
    quickLinks: "روابط سريعة",
    partners: "الشركاء",
    services: "الخدمات",
    propertyManagement: "إدارة الممتلكات",
    realEstateConsulting: "استشارات عقارية",
    investmentAdvisory: "الاستشارات الاستثمارية",
    contactUs: "اتصل بنا",
    email: "info@aqarverse.com",
    phone: "+966 XX XXX XXXX",
    location: "الرياض، المملكة العربية السعودية",
    rightsReserved: "عقار فيرس. جميع الحقوق محفوظة.",
    privacyPolicy: "سياسة الخصوصية",
    termsOfService: "شروط الخدمة",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved === "ar" || saved === "en") ? saved : "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ar" : "en"));
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};