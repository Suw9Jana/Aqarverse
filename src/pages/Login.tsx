import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

// Firebase
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

async function routeByRole(uid: string, navigate: ReturnType<typeof useNavigate>) {
  try {
    const adminSnap = await getDoc(doc(db, "admin", uid));
    if (adminSnap.exists() && adminSnap.data()?.role === "admin") {
      navigate("/dashboard/admin", { replace: true });
      return;
    }
  } catch {}
  const companySnap = await getDoc(doc(db, "company", uid));
  if (companySnap.exists()) {
    navigate("/dashboard/company", { replace: true });
    return;
  }
  const customerSnap = await getDoc(doc(db, "Customer", uid));
  if (customerSnap.exists()) {
    navigate("/dashboard/customer", { replace: true });
    return;
  }
  navigate("/partners", { replace: true });
}

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [working, setWorking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (working) return;
    setWorking(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);

      if (!cred.user.emailVerified) {
        await signOut(auth);
        throw new Error("Please verify your email before logging in. We sent you a verification link.");
      }

      await routeByRole(cred.user.uid, navigate);

      toast({ title: "Login Successful", description: "Welcome back!" });
    } catch (err: any) {
      const message =
        err?.code === "auth/invalid-credential" ||
        err?.code === "auth/wrong-password" ||
        err?.code === "auth/user-not-found"
          ? "Invalid email or password."
          : err?.code === "permission-denied"
          ? "Missing or insufficient Firestore permissions for this user."
          : err?.message || "Login failed. Please try again.";
      toast({ title: "Login Failed", description: message, variant: "destructive" });
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>Sign in to your AqarVerse account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPwd ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={working}>
                  {working ? "Signing in…" : "Sign In"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Login;
