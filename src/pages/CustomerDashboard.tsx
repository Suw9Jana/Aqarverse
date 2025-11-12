// src/pages/CustomerDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User, Heart, MapPin, Ruler, Building } from "lucide-react"; // removed DollarSign
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/aqarverse_logo.jpg";
import sarMask from "@/assets/Saudi_Riyal_icon.png"; // ⬅️ your icon (PNG works great as a mask)

/* Firebase */
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
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
  companyName?: string;

  imageUrl?: string;
  coverUrl?: string;
  photoUrl?: string;
  coverPath?: string;
  photoPath?: string;
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
  const [loadingProps, setLoadingProps] = useState(false);
  const [properties, setProperties] = useState<PropertyDoc[]>([]);

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
      data.mainImagePath,
      data.imagePath,
      Array.isArray(data.images) && typeof data.images[0] === "string" ? data.images[0] : undefined,
      Array.isArray(data.images) && typeof data.images[0]?.path === "string" ? data.images[0].path : undefined,
    ].filter(Boolean) as string[];
    return candidates[0];
  };

  // 2) fetch Property docs + resolve image URL
  useEffect(() => {
    const run = async () => {
      if (favIds.length === 0) {
        setProperties([]);
        return;
      }
      setLoadingProps(true);
      try {
        const chunks: string[][] = [];
        for (let i = 0; i < favIds.length; i += 10) chunks.push(favIds.slice(i, i + 10));

        const results: PropertyDoc[] = [];
        for (const ids of chunks) {
          const qRef = query(collection(db, "Property"), where(documentId(), "in", ids));
          const snap = await getDocs(qRef);
          for (const d of snap.docs) {
            const data = d.data() as any;

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

            results.push({ id: d.id, ...data, imageUrl: imgUrl });
          }
        }
        setProperties(results);
      } catch (err: any) {
        toast({
          title: "Failed to load properties",
          description: err.message || "Could not load favorite properties.",
          variant: "destructive",
        });
      } finally {
        setLoadingProps(false);
      }
    };
    run();
  }, [favIds, toast]);

  const handleLogout = () => {
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    setTimeout(() => navigate("/partners"), 600);
  };

  const empty = useMemo(
    () => authReady && !loadingFavIds && !loadingProps && properties.length === 0,
    [authReady, loadingFavIds, loadingProps, properties.length]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AqarVerse" className="h-14 w-14 object-contain rounded-lg" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AqarVerse
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/profile/edit?role=customer")}
              className="hover:bg-primary/10"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="hover:bg-primary/10">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
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

        {authReady && (loadingFavIds || loadingProps) && (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">Loading…</p>
            </CardContent>
          </Card>
        )}

        {authReady && empty && (
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

        {authReady && !empty && properties.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property, index) => (
              <Card
                key={property.id}
                className="group overflow-hidden hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border-primary/20 bg-card/80 backdrop-blur-sm hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* cover */}
                <div className="relative w-full aspect-[16/10] overflow-hidden">
                  {property.imageUrl ? (
                    <img
                      src={property.imageUrl}
                      alt={property.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted/40 grid place-items-center text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {property.title}
                    </CardTitle>
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
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {property.description}
                    </p>
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
                        {/* ↑ number first, then 'SAR' to match your preference */}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
