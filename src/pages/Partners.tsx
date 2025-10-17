import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { CompanyCard } from "@/components/CompanyCard";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles } from "lucide-react";
import { mockCompanies } from "@/data/mockData";
import riyadhSkyline from "@/assets/riyadh-skyline.jpg";

const ITEMS_PER_LOAD = 3;

const Partners = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsToShow, setItemsToShow] = useState(ITEMS_PER_LOAD);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const filteredCompanies = mockCompanies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedCompanies = filteredCompanies.slice(0, itemsToShow);
  const hasMore = itemsToShow < filteredCompanies.length;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-index'));
          if (entry.isIntersecting) {
            setVisibleCards((prev) => new Set([...prev, index]));
          }
        });
      },
      { threshold: 0.1 }
    );

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, [displayedCompanies]);

  useEffect(() => {
    setItemsToShow(ITEMS_PER_LOAD);
    setVisibleCards(new Set());
    cardsRef.current = [];
  }, [searchQuery]);

  const loadMore = () => {
    navigate('/partners/all');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section with Enhanced Visual Effects */}
      <section className="relative overflow-hidden min-h-[600px] flex items-center" style={{ background: 'var(--gradient-hero)' }}>
        {/* Background image with overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ 
            backgroundImage: `url(${riyadhSkyline})`,
            filter: 'contrast(1.1) brightness(0.9)'
          }}
        />
        
        {/* Gradient mesh overlay */}
        <div className="absolute inset-0" style={{ background: 'var(--gradient-mesh)' }}></div>
        
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse" style={{ background: 'radial-gradient(circle, hsl(45 100% 70%), transparent)' }}></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full opacity-20 blur-3xl animate-pulse" style={{ background: 'radial-gradient(circle, hsl(43 100% 75%), transparent)', animationDelay: '1s' }}></div>
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Premium badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/30 mb-8 animate-fade-in shadow-lg">
              <Sparkles className="h-4 w-4 text-white animate-pulse" />
              <span className="text-sm font-semibold text-white tracking-wide">{t("poweredBy")}</span>
            </div>
            
            {/* Main heading with enhanced styling */}
            <h1 className="text-6xl md:text-8xl font-extrabold mb-8 tracking-tight animate-fade-in leading-none">
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/90 drop-shadow-2xl">
                {t("welcomeTitle")}
              </span>
            </h1>
            
            {/* Enhanced description */}
            <p className="text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto font-light text-white/95 animate-fade-in drop-shadow-lg mb-8">
              {t("welcomeDescription")}
            </p>
          </div>
        </div>
        
        {/* Bottom decorative border */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="h-1" style={{ background: 'var(--gradient-accent)' }}></div>
          <div className="h-px bg-white/20"></div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-20 md:py-24 relative">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-40 right-0 w-72 h-72 rounded-full opacity-5 blur-3xl" style={{ background: 'var(--gradient-accent)' }}></div>
          <div className="absolute bottom-40 left-0 w-96 h-96 rounded-full opacity-5 blur-3xl" style={{ background: 'var(--gradient-accent)' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section header with enhanced styling */}
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                <span className="text-sm font-semibold text-primary tracking-wide">Featured Partners</span>
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
              {t("trustedPartners")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
              {t("partnersDescription")}
            </p>
          </div>

          {/* Enhanced search bar */}
          <div className="mb-16 max-w-xl mx-auto">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-14 rounded-2xl border-2 border-border/50 focus:border-primary/50 transition-all text-base shadow-lg focus:shadow-xl"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
          </div>

          {/* Partners grid with enhanced spacing */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-16">
            {displayedCompanies.map((company, index) => (
              <div
                key={company.id}
                ref={(el) => (cardsRef.current[index] = el)}
                data-index={index}
                className={`transition-all duration-700 ${
                  visibleCards.has(index)
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-12'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CompanyCard company={company} />
              </div>
            ))}
          </div>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("noResults")}</p>
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center pt-8">
              <Button 
                onClick={loadMore}
                size="lg"
                className="min-w-[240px] h-14 text-base font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t("loadMore")}
                  <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Partners;
