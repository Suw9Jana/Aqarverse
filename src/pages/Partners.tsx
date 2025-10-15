import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { CompanyCard } from "@/components/CompanyCard";
import { ThreeBackground } from "@/components/ThreeBackground";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { mockCompanies } from "@/data/mockData";

const ITEMS_PER_PAGE = 6;

const Partners = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCompanies = mockCompanies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCompanies = filteredCompanies.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section with 3D Background */}
      <section className="relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        <ThreeBackground />
        
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 backdrop-blur-sm border border-white/20 mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-white">Powered by Virtual Reality Technology</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight animate-fade-in bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/80">
              Welcome to AqarVerse
            </h1>
            <p className="text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto font-light text-white/90 animate-fade-in">
              Bridging the future of real estate with immersive virtual experiences. 
              We connect leading property companies to the metaverse, transforming how 
              people explore, experience, and engage with properties in stunning 3D environments.
            </p>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'var(--gradient-accent)' }}></div>
      </section>

      <main className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Trusted Partners
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
              Discover our network of premium real estate companies pioneering the virtual property experience
            </p>
          </div>

          <div className="mb-12 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by company name or city..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 h-12 rounded-xl border-border/50 focus:border-primary/30 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {paginatedCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No companies found matching your search.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="min-w-[40px]"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Partners;
