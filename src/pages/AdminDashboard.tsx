import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, LogOut, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/aqarverse_logo.jpg";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/* Firebase */
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

type Status = "draft" | "pending_review" | "approved" | "rejected";

type PropertyRow = {
  id: string;
  title: string;
  type: string;
  city: string;
  neighborhood?: string;
  status: Status;
  ownerUid: string;
  createdAt?: any;
  updatedAt?: any;
  rejectionReason?: string;
};

type CompanyDoc = {
  companyName?: string;
  email?: string;
  phone?: string;
  Location?: string;
};

const STATUS_FILTERS: Array<Status | "all"> = ["all", "pending_review", "approved", "rejected", "draft"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [companyByUid, setCompanyByUid] = useState<Record<string, CompanyDoc>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");

  // Reject dialog state
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // ---- Live stream all properties (admins can read all) ----
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "Property"),
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as PropertyRow[];
        // Sort client-side by createdAt desc if present
        rows.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setProperties(rows);
        setLoading(false);
      },
      (err) => {
        console.error("[AdminDashboard] onSnapshot error", err);
        setLoading(false);
        toast({
          title: "Failed to load properties",
          description: err.message,
          variant: "destructive",
        });
      }
    );
    return () => unsub();
  }, [toast]);

  // ---- Fetch related company docs (name/email) for display ----
  useEffect(() => {
    (async () => {
      const uids = Array.from(new Set(properties.map((p) => p.ownerUid))).filter(Boolean);
      const nextMap: Record<string, CompanyDoc> = { ...companyByUid };
      await Promise.all(
        uids.map(async (uid) => {
          if (nextMap[uid]) return;
          const s = await getDoc(doc(db, "company", uid));
          if (s.exists()) {
            nextMap[uid] = s.data() as CompanyDoc;
          } else {
            nextMap[uid] = {};
          }
        })
      );
      setCompanyByUid(nextMap);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties]);

  // ---- Filters + search (client-side) ----
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return properties.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;

      if (!q) return true;

      const companyName = companyByUid[p.ownerUid]?.companyName || "";
      const location = [p.city || "", p.neighborhood || ""].filter(Boolean).join(" ");

      return (
        (p.title || "").toLowerCase().includes(q) ||
        (p.type || "").toLowerCase().includes(q) ||
        companyName.toLowerCase().includes(q) ||
        location.toLowerCase().includes(q)
      );
    });
  }, [properties, companyByUid, searchQuery, statusFilter]);

  // ---- Actions: approve / reject ----
  const approveProperty = async (id: string) => {
    try {
      await updateDoc(doc(db, "Property", id), {
        status: "approved",
        rejectionReason: "",
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Approved", description: "Property has been approved." });
    } catch (err: any) {
      toast({
        title: "Approve failed",
        description: err?.message || "Could not approve property.",
        variant: "destructive",
      });
    }
  };

  const openReject = (id: string) => {
    setRejectTargetId(id);
    setRejectReason("");
    setRejectOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectTargetId) return;
    if (!rejectReason.trim()) {
      toast({ title: "Reason required", description: "Please provide a rejection reason.", variant: "destructive" });
      return;
    }
    try {
      await updateDoc(doc(db, "Property", rejectTargetId), {
        status: "rejected",
        rejectionReason: rejectReason.trim(),
        updatedAt: serverTimestamp(),
      });
      setRejectOpen(false);
      setRejectTargetId(null);
      setRejectReason("");
      toast({ title: "Rejected", description: "Property has been rejected with your reason." });
    } catch (err: any) {
      toast({
        title: "Reject failed",
        description: err?.message || "Could not reject property.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    setTimeout(() => navigate("/partners"), 600);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AqarVerse" className="h-14 w-14 object-contain" />
            <span className="text-xl font-bold text-primary">AqarVerse Admin</span>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Review Queue</h1>
          <p className="text-muted-foreground">Review and manage submitted properties</p>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by property, company, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as Status | "all")}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? "All Status" :
                   s === "pending_review" ? "Pending" :
                   s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading…</p>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No properties found matching your filters</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const company = companyByUid[p.ownerUid] || {};
                  const companyName = company.companyName || "—";
                  const location = [p.city || "", p.neighborhood || ""].filter(Boolean).join(" — ");
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell>{companyName}</TableCell>
                      <TableCell>{p.type}</TableCell>
                      <TableCell>{location || "—"}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {p.status !== "approved" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => approveProperty(p.id)}
                              title="Approve"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                          )}
                          {p.status !== "rejected" && (
                            <Dialog open={rejectOpen && rejectTargetId === p.id} onOpenChange={(o) => {
                              // If dialog is being opened from its trigger, set target id.
                              if (o && rejectTargetId !== p.id) {
                                setRejectTargetId(p.id);
                                setRejectReason("");
                              }
                              setRejectOpen(o);
                              if (!o) {
                                setRejectTargetId(null);
                                setRejectReason("");
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openReject(p.id)}
                                  title="Reject"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Provide a rejection reason</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3">
                                  <Label htmlFor="reason">Reason</Label>
                                  <Textarea
                                    id="reason"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Explain why this property is rejected…"
                                    rows={4}
                                  />
                                </div>
                                <DialogFooter className="mt-4">
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogClose>
                                  <Button onClick={confirmReject} variant="destructive">
                                    Reject Property
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
