// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

// Firebase
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type Role = "customer" | "company" | "admin";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "customer" as Role,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1) Auth: email/password sign-in
      const cred = await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);

      // 2) Block if email not verified
      if (!cred.user.emailVerified) {
        // Sign out to avoid keeping an unverified session
        await signOut(auth);
        throw new Error("Please verify your email before logging in. We sent you a verification link.");
      }

      const uid = cred.user.uid;

      // 3) Load profile strictly by UID (matches your Firestore rules)
      let savedRole: Role | null = null;
      let profile: any = null;

      const customerSnap = await getDoc(doc(db, "Customer", uid));
      if (customerSnap.exists()) {
        savedRole = "customer";
        profile = customerSnap.data();
      } else {
        const companySnap = await getDoc(doc(db, "company", uid));
        if (companySnap.exists()) {
          savedRole = "company";
          profile = companySnap.data();
        } else {
          // Optional: allow self-read on /admin/{uid} in rules if you want to detect admin here
          // const adminSnap = await getDoc(doc(db, "admin", uid));
          // if (adminSnap.exists()) {
          //   savedRole = "admin";
          //   profile = adminSnap.data();
          // }
        }
      }

      if (!savedRole) {
        throw new Error("Profile not found. Your account exists in Auth but no matching profile document was found.");
      }

      // 4) Optional: reconcile selected radio vs true role
      if (formData.role !== savedRole) {
        toast({
          title: "Role corrected",
          description: `You selected "${formData.role}", but your account role is "${savedRole}".`,
        });
      }

      toast({
        title: "Login Successful",
        description: `Welcome back${profile?.name ? `, ${profile.name}` : ""}!`,
      });

      // 5) Route by role
      setTimeout(() => {
        if (savedRole === "company") navigate("/dashboard/company");
        else if (savedRole === "admin") navigate("/dashboard/admin");
        else navigate("/dashboard/customer");
      }, 800);
    } catch (err: any) {
      const message =
        err?.code === "auth/invalid-credential" ||
        err?.code === "auth/wrong-password" ||
        err?.code === "auth/user-not-found"
          ? "Invalid email or password."
          : err?.code === "permission-denied"
          ? "Missing or insufficient Firestore permissions for this user."
          : err?.message || "Login failed. Please try again.";

      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
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
                  <Label>I am a</Label>
                  <RadioGroup
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value as Role })}
                    className="flex flex-col space-y-2 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="customer" id="customer" />
                      <Label htmlFor="customer" className="font-normal cursor-pointer">
                        Customer
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="company" id="company" />
                      <Label htmlFor="company" className="font-normal cursor-pointer">
                        Real Estate Company
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="admin" id="admin" />
                      <Label htmlFor="admin" className="font-normal cursor-pointer">
                        Platform Administrator
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Sign In
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() =>
                      toast({
                        title: "Forgot Password",
                        description: "Password reset functionality will be available soon.",
                      })
                    }
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <p className="text-sm text-center text-muted-foreground">
                  {formData.role === "admin"
                    ? "Admin: admin@example.com / admin123"
                    : formData.role === "company"
                    ? "Company: company@example.com / password123"
                    : "Customer: customer@example.com / customer123"}
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Login;
