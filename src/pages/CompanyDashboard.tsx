// src/pages/CompanyDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge"; // <<< default import (only this line)
import { Edit, Trash2, Send, Plus, LogOut, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/aqarverse_logo.jpg";

/* Firebase */
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  updateDoc,
  serverTimestamp,
  FirestoreError,
} from "firebase/firestore";

type Status = "draft" | "pending_review" | "approved" | "rejected";

type PropertyRow = {
  id: string;
  title: string;
  type: string;
  city: string;
  neighborhood?: string;
  status: Status;
  rejectionReason?: string;
  createdAt?: any;
  updatedAt?: any;
};

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<PropertyRow[]>([]);

  // 1) Wait for Auth (prevents blank page after redirect)
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsubAuth;
  }, []);

  // 2) Subscribe to this owner's properties
  useEffect(() => {
    if (!authReady) return;

    if (!user?.uid) {
      setProperties([]);
      setLoading(false);
      return;
    }

    // No orderBy => no composite index needed
    const q = query(collection(db, "Property"), where("ownerUid", "==", user.uid));

    setLoading(true);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as PropertyRow[];
        // optional client-side sort by createdAt desc
        rows.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setProperties(rows);
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error("[Property onSnapshot error]", err);
        setLoading(false);
        toast({
          title: "Failed to load properties",
          description:
            err.code === "failed-precondition"
              ? "This query needs a Firestore index. (We removed orderBy to avoid that.)"
              : err.message,
          variant: "destructive",
        });
      }
    );

    return () => unsub();
  }, [authReady, user, toast]);

  // Actions
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "Property", id));
      toast({ title: "Property Deleted", description: "The property has been removed." });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message || "Could not delete property.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitForReview = async (id: string) => {
    try {
      await updateDoc(doc(db, "Property", id), {
        status: "pending_review",
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Submitted", description: "Your property has been submitted for review." });
    } catch (err: any) {
      toast({
        title: "Submit failed",
        description:
          err?.code === "permission-denied"
            ? "You do not have permission to change this property."
            : err?.message || "Could not submit property.",
        variant: "destructive",
      });
    }
  };

  const rejected = useMemo(() => properties.filter((p) => p.status === "rejected"), [properties]);

  const handleLogout = () => {
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    setTimeout(() => navigate("/partners"), 500);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AqarVerse" className="h-14 w-14 object-contain" />
            <span className="text-xl font-bold text-primary">AqarVerse</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/profile/edit?role=company")}>
              <User className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Properties</h1>
            <p className="text-muted-foreground">Manage your property listings</p>
          </div>
          <Link to="/dashboard/company/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </Link>
        </div>

        {!authReady ? (
          <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">Checking session…</p></CardContent></Card>
        ) : loading ? (
          <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">Loading…</p></CardContent></Card>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No properties yet</p>
              <Link to="/dashboard/company/add">
                <Button><Plus className="h-4 w-4 mr-2" />Add Your First Property</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>{p.type}</TableCell>
                    <TableCell>{p.city}{p.neighborhood ? ` — ${p.neighborhood}` : ""}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/company/edit/${p.id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {p.status === "draft" && (
                          <Button variant="ghost" size="icon" onClick={() => handleSubmitForReview(p.id)} title="Submit for review">
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {rejected.length > 0 && (
          <Card className="mt-6 border-destructive/50">
            <CardHeader><CardTitle className="text-destructive">Rejected Properties</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {rejected.map((p) => (
                <div key={p.id} className="p-4 bg-destructive/5 rounded-lg">
                  <p className="font-medium mb-2">{p.title}</p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Reason:</strong> {p.rejectionReason || "Not provided by admin."}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboard;
