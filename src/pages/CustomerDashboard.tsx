// src/pages/CustomerDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User, Heart, MapPin, Ruler, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/aqarverse_logo.jpg";
import sarMask from "@/assets/Saudi_Riyal_icon.png";

/* Firebase */
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, onSnapshot, query, where, documentId } from "firebase/firestore";
import { getDownloadURL, ref as sRef } from "firebase/storage";

type Status = "draft" | "pending_review" | "approved" | "rejected";

type PropertyDoc = {
  id: string;
  title: string;
  description?: string;
  type: string;
  city: string;
  neighborhood?: string;
  size?: number;
  price?: number;
  status: Status;
  ownerUid: string;

  // will be attached by join (company/{ownerUid})
  companyName?: string;

  imageUrl?: string;
  coverUrl?: string;
  photoUrl?: string;
  coverPath?: string;
  photoPath?: string;
  imagePath?: string; // ✅ you have this in Firestore
  images?: any[];
};

/** Saudi Riyal icon that tints to currentColor using CSS mask (works with PNG or SVG). */
const SARIcon = ({ className }: { className?: string }) => {
  const baseStyle: React.CSSProperties = {
    width: "1rem",
    height: "1rem",
    backgroundColor: "currentColor",
    WebkitMaskImage: `url(${sarMask})`,
    maskImage: `url(${sarMask})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    display: "inline-block",
  };
  return <span className={className} style={baseStyle} aria-hidden="true" />;
};

/* ---------- formatters ---------- */
const fmtArea = (v: number) => `${Number(v).toLocaleString("en-US")} m²`;
const fmtSAR = (v: number) => `${Number(v).toLocaleString("en-SA", { maximumFractionDigits: 0 })} SAR`;

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ---- Auth gate ----
  const [authReady, setAuthReady] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  // ---- Favorites + properties ----
  const [loadingFavIds, setLoadingFavIds] = useState(true);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [loadingFavProps, setLoadingFavProps] = useState(false);
  const [favoriteProperties, setFavoriteProperties] = useState<PropertyDoc[]>([]);

  // ---- All properties ----
  const [loadingAllProps, setLoadingAllProps] = useState(false);
  const [allProperties, setAllProperties] = useState<PropertyDoc[]>([]);

  // 1) listen to favorites
  useEffect(() => {
    if (!authReady) return;
    if (!uid) {
      setFavIds([]);
      setLoadingFavIds(false);
      return;
    }

    setLoadingFavIds(true);
    const favCol = collection(db, "Customer", uid, "favorites");
    const unsub = onSnapshot(
      favCol,
      (snap) => {
        const ids = snap.docs.map((d) => d.id);
        setFavIds(ids);
        setLoadingFavIds(false);
      },
      (err) => {
        setLoadingFavIds(false);
        toast({
          title: "Failed to load favorites",
          description: err.code === "permission-denied" ? "Missing or insufficient permissions." : err.message,
          variant: "destructive",
        });
      }
    );
    return () => unsub();
  }, [authReady, uid, toast]);

  const pickHttps = (v: any): string | undefined => {
    if (!v) return undefined;
    if (typeof v === "string" && v.startsWith("http")) return v;
    if (Array.isArray(v)) {
      const found = v.find((x) => typeof x === "string" && x.startsWith("http"));
      if (found) return found;
      const fromObj = v.find((x) => typeof x?.url === "string" && x.url.startsWith("http"));
      if (fromObj) return fromObj.url;
    }
    if (typeof v === "object") {
      const keys = ["imageUrl", "url", "downloadUrl", "src"];
      for (const k of keys) {
        const val = (v as any)[k];
        if (typeof val === "string" && val.startsWith("http")) return val;
      }
    }
    return undefined;
  };

  const pickStoragePath = (data: any): string | undefined => {
    const candidates = [
      data.coverPath,
      data.photoPath,
      data.imagePath, // ✅ your actual field
      data.mainImagePath,
      data.imagePath,
      Array.isArray(data.images) && typeof data.images[0] === "string" ? data.images[0] : undefined,
      Array.isArray(data.images) && typeof data.images[0]?.path === "string" ? data.images[0].path : undefined,
    ].filter(Boolean) as string[];
    return candidates[0];
  };

  const enrichPropertyWithImage = async (docId: string, data: any): Promise<PropertyDoc> => {
    let imgUrl =
      pickHttps(data.imageUrl) ||
      pickHttps(data.coverUrl) ||
      pickHttps(data.photoUrl) ||
      pickHttps(data.images);

    if (!imgUrl) {
      const path = pickStoragePath(data);
      if (path) {
        try {
          imgUrl = await getDownloadURL(sRef(storage, path));
        } catch {
          /* ignore */
        }
      }
    }

    return { id: docId, ...data, imageUrl: imgUrl } as PropertyDoc;
  };

  // ✅ JOIN: company name using ownerUid -> company/{ownerUid}
  const attachCompanyNames = async (list: PropertyDoc[]): Promise<PropertyDoc[]> => {
    const ownerUids = Array.from(
      new Set(
        list
          .map((p) => p.ownerUid)
          .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      )
    );

    if (ownerUids.length === 0) {
      return list.map((p) => ({ ...p, companyName: p.companyName || "Unknown Company" }));
    }

    const chunks: string[][] = [];
    for (let i = 0; i < ownerUids.length; i += 10) chunks.push(ownerUids.slice(i, i + 10));

    const map = new Map<string, string>();

    try {
      for (const ids of chunks) {
        // IMPORTANT: your collection is "company" (lowercase) in your console + rules
        const qRef = query(collection(db, "company"), where(documentId(), "in", ids));
        const snap = await getDocs(qRef);

        snap.docs.forEach((d) => {
          const data = d.data() as any;
          const name =
            data.companyName ||
            data.name ||
            data.displayName ||
            data.legalName ||
            data.username ||
            data.email ||
            undefined;

          if (typeof name === "string" && name.trim().length > 0) {
            map.set(d.id, name.trim());
          }
        });
      }
    } catch {
      // if company reads fail, keep Unknown Company
    }

    return list.map((p) => ({
      ...p,
      companyName: p.companyName || map.get(p.ownerUid) || "Unknown Company",
    }));
  };

  // 2) fetch Favorite Property docs + resolve image URL + attach company name
  useEffect(() => {
    const run = async () => {
      if (favIds.length === 0) {
        setFavoriteProperties([]);
        return;
      }

      setLoadingFavProps(true);
      try {
        const chunks: string[][] = [];
        for (let i = 0; i < favIds.length; i += 10) chunks.push(favIds.slice(i, i + 10));

        const results: PropertyDoc[] = [];
        for (const ids of chunks) {
          const qRef = query(collection(db, "Property"), where(documentId(), "in", ids));
          const snap = await getDocs(qRef);

          for (const d of snap.docs) {
            const data = d.data() as any;
            results.push(await enrichPropertyWithImage(d.id, data));
          }
        }

        setFavoriteProperties(await attachCompanyNames(results));
      } catch (err: any) {
        toast({
          title: "Failed to load favorite properties",
          description: err.message || "Could not load favorite properties.",
          variant: "destructive",
        });
      } finally {
        setLoadingFavProps(false);
      }
    };

    run();
  }, [favIds, toast]);

  // 3) fetch ALL properties + attach company name
  useEffect(() => {
    const run = async () => {
      if (!authReady) return;

      setLoadingAllProps(true);
      try {
        const snap = await getDocs(collection(db, "Property"));
        const results: PropertyDoc[] = [];

        for (const d of snap.docs) {
          const data = d.data() as any;
          results.push(await enrichPropertyWithImage(d.id, data));
        }

        setAllProperties(await attachCompanyNames(results));
      } catch (err: any) {
        toast({
          title: "Failed to load properties",
          description: err.message || "Could not load properties.",
          variant: "destructive",
        });
      } finally {
        setLoadingAllProps(false);
      }
    };

    run();
  }, [authReady, toast]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      navigate("/partners");
    } catch (err: any) {
      toast({
        title: "Logout failed",
        description: err?.message || "Could not log out.",
        variant: "destructive",
      });
    }
  };

  const emptyFavorites = useMemo(
    () => authReady && !loadingFavIds && !loadingFavProps && favoriteProperties.length === 0,
    [authReady, loadingFavIds, loadingFavProps, favoriteProperties.length]
  );

  // helper to render company name nicely
  const CompanyBadge = ({ name }: { name?: string }) => (
    <div className="w-full mt-3 flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
      <Building className="h-4 w-4 text-primary" />
      <span className="font-medium text-foreground">{name || "Unknown Company"}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/partners" className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity">
            <img src={logo} alt="AqarVerse" className="h-14 w-14 object-contain rounded-lg" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AqarVerse
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/profile/edit?role=customer")}>
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>

            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* -------- Favorites section -------- */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-3">
            My Favorites
          </h1>
          <p className="text-lg text-muted-foreground">Properties you've saved for later</p>
        </div>

        {!authReady && (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">Checking session…</p>
            </CardContent>
          </Card>
        )}

        {authReady && (loadingFavIds || loadingFavProps) && (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">Loading…</p>
            </CardContent>
          </Card>
        )}

        {authReady && emptyFavorites && (
          <Card className="border-dashed border-2 bg-card/50 backdrop-blur-sm">
            <CardContent className="py-16 text-center">
              <div className="inline-flex p-4 rounded-full bg-primary/10 mb-6">
                <Heart className="h-12 w-12 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">No favorite properties yet</p>
              <p className="text-muted-foreground">Start exploring and save properties you like</p>
            </CardContent>
          </Card>
        )}

        {authReady && !emptyFavorites && favoriteProperties.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {favoriteProperties.map((property, index) => (
              <Card
                key={property.id}
                className="group overflow-hidden hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border-primary/20 bg-card/80 backdrop-blur-sm hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative w-full aspect-[16/10] overflow-hidden">
                  {property.imageUrl ? (
                    <img
                      src={property.imageUrl}
                      alt={property.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted/40 grid place-items-center text-muted-foreground">No image</div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{property.title}</CardTitle>

                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                      <Heart className="h-5 w-5 fill-current" />
                    </Button>
                  </div>

                  {property.companyName && (
                    <CardDescription className="flex items-center gap-2 text-sm">
                      <div className="p-1 rounded bg-primary/10">
                        <Building className="h-3.5 w-3.5 text-primary" />
                      </div>
                      {property.companyName}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {property.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{property.description}</p>
                  )}

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-sm p-2 rounded-lg bg-primary/5">
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-foreground">
                        {property.city}
                        {property.neighborhood ? ` — ${property.neighborhood}` : ""}
                      </span>
                    </div>

                    {typeof property.size === "number" && (
                      <div className="flex items-center gap-3 text-sm p-2 rounded-lg bg-primary/5">
                        <Ruler className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-foreground">{fmtArea(property.size)}</span>
                      </div>
                    )}

                    {typeof property.price === "number" && (
                      <div className="flex items-center gap-3 text-sm p-2 rounded-lg bg-primary/5">
                        <SARIcon className="text-primary flex-shrink-0" />
                        <span className="text-foreground font-semibold">{fmtSAR(property.price)}</span>
                      </div>
                    )}
                  </div>

                  <CompanyBadge name={property.companyName} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* -------- All Properties section -------- */}
        <div className="mt-20">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-2">All Properties</h2>
            <p className="text-muted-foreground">Browse all available listings</p>
          </div>

          {loadingAllProps && (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">Loading…</p>
              </CardContent>
            </Card>
          )}

          {!loadingAllProps && allProperties.length === 0 && (
            <Card className="border-dashed border-2 bg-card/50 backdrop-blur-sm">
              <CardContent className="py-16 text-center">
                <p className="text-lg font-medium text-foreground mb-2">No properties found</p>
                <p className="text-muted-foreground">Check back later</p>
              </CardContent>
            </Card>
          )}

          {!loadingAllProps && allProperties.length > 0 && (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {allProperties.map((property, index) => (
                <Card
                  key={property.id}
                  className="group overflow-hidden hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border-primary/20 bg-card/80 backdrop-blur-sm hover:-translate-y-2"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="relative w-full aspect-[16/10] overflow-hidden">
                    {property.imageUrl ? (
                      <img
                        src={property.imageUrl}
                        alt={property.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted/40 grid place-items-center text-muted-foreground">No image</div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>

                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{property.title}</CardTitle>

                    {property.companyName && (
                      <CardDescription className="flex items-center gap-2 text-sm mt-2">
                        <div className="p-1 rounded bg-primary/10">
                          <Building className="h-3.5 w-3.5 text-primary" />
                        </div>
                        {property.companyName}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {property.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{property.description}</p>
                    )}

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-3 text-sm p-2 rounded-lg bg-primary/5">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-foreground">
                          {property.city}
                          {property.neighborhood ? ` — ${property.neighborhood}` : ""}
                        </span>
                      </div>

                      {typeof property.size === "number" && (
                        <div className="flex items-center gap-3 text-sm p-2 rounded-lg bg-primary/5">
                          <Ruler className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-foreground">{fmtArea(property.size)}</span>
                        </div>
                      )}

                      {typeof property.price === "number" && (
                        <div className="flex items-center gap-3 text-sm p-2 rounded-lg bg-primary/5">
                          <SARIcon className="text-primary flex-shrink-0" />
                          <span className="text-foreground font-semibold">{fmtSAR(property.price)}</span>
                        </div>
                      )}
                    </div>

                    <CompanyBadge name={property.companyName} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
