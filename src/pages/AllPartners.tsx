import { useState, useEffect, useRef, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { CompanyCard } from "@/components/CompanyCard";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* Firebase */
import { db, storage } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { ref as sRef, getDownloadURL } from "firebase/storage";

const ITEMS_PER_LOAD = 9;

type CompanyDoc = {
  id: string;
  companyName?: string;
  Location?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;   // قد تكون https أو gs
  photoURL?: string;
  photoPath?: string;
  logoPath?: string;
};

export default function AllPartners() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [itemsToShow, setItemsToShow] = useState(ITEMS_PER_LOAD);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [companies, setCompanies] = useState<CompanyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const resolveToHttps = async (candidate?: string): Promise<string | undefined> => {
    if (!candidate) return undefined;
    if (candidate.startsWith("http")) return candidate;
    try {
      const url = await getDownloadURL(sRef(storage, candidate));
      return url;
    } catch {
      return undefined;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "company"));
        const rows: CompanyDoc[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            companyName: data.companyName || "",
            Location: data.Location || data.city || "",
            email: data.email || "",
            phone: data.phone || "",
            photoUrl: data.photoUrl || data.photoURL || "",
            photoURL: data.photoURL || "",
            photoPath: data.photoPath || "",
            logoPath: data.logoPath || "",
          };
        });

        const resolved = await Promise.all(
          rows.map(async (r) => {
            let finalUrl = await resolveToHttps(r.photoUrl);
            if (!finalUrl) {
              finalUrl =
                (await resolveToHttps(r.photoPath)) ||
                (await resolveToHttps(r.logoPath)) ||
                (await resolveToHttps(r.photoURL));
            }
            return { ...r, photoUrl: finalUrl };
          })
        );

        setCompanies(resolved);
      } catch (e: any) {
        toast({
          title: "Could not load partners",
          description:
            e?.code === "permission-denied"
              ? "Missing read permission on the 'company' collection."
              : e?.message || "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const filteredCompanies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => {
      const name = (c.companyName || "").toLowerCase();
      const city = (c.Location || "").toLowerCase();
      return name.includes(q) || city.includes(q);
    });
  }, [companies, searchQuery]);

  const displayedCompanies = filteredCompanies.slice(0, itemsToShow);
  const hasMore = itemsToShow < filteredCompanies.length;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute("data-index"));
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

  const loadMore = () => setItemsToShow((prev) => prev + ITEMS_PER_LOAD);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {loading ? "…" : companies.length} {t("partners")}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{t("allPartners")}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("browseAllPartners")}</p>
          </div>

          <div className="mb-10 max-w-md mx-auto">
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

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading…</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {displayedCompanies.map((c, index) => (
                  <div
                    key={c.id}
                    ref={(el) => (cardsRef.current[index] = el)}
                    data-index={index}
                    className={`transition-all duration-700 ${visibleCards.has(index) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                    style={{ transitionDelay: `${(index % ITEMS_PER_LOAD) * 100}ms` }}
                  >
                    <CompanyCard
                      company={{
                        id: c.id,
                        name: c.companyName || "—",
                        city: c.Location || "—",
                        email: c.email || "—",
                        phone: c.phone || "—",
                        imageUrl: c.photoUrl || undefined,
                      }}
                    />
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
                  <Button onClick={loadMore} size="lg" className="min-w-[200px]">
                    {t("loadMore")}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
