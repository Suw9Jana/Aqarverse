import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { CompanyCard } from "@/components/CompanyCard";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles } from "lucide-react";
import { mockCompanies } from "@/data/mockData";
import riyadhSkyline from "@/assets/riyadh-skyline.jpg";

const ITEMS_PER_LOAD = 6;

const Partners = () => {
  const { t } = useLanguage();
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
    setItemsToShow(prev => prev + ITEMS_PER_LOAD);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section with Buildings Background */}
      <section className="relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ 
            backgroundImage: `url(${riyadhSkyline})`
          }}
        />
        
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 backdrop-blur-sm border border-white/20 mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-white">{t("poweredBy")}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight animate-fade-in bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/80">
              {t("welcomeTitle")}
            </h1>
            <p className="text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto font-light text-white/90 animate-fade-in">
              {t("welcomeDescription")}
            </p>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'var(--gradient-accent)' }}></div>
      </section>

      <main className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t("trustedPartners")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
              {t("partnersDescription")}
            </p>
          </div>

          <div className="mb-12 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl border-border/50 focus:border-primary/30 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
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
            <div className="flex justify-center">
              <Button 
                onClick={loadMore}
                size="lg"
                className="min-w-[200px]"
              >
                {t("loadMore")}
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
