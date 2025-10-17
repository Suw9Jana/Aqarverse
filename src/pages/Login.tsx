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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "customer" as "customer" | "company" | "admin",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1) Auth: verify email/password
      const cred = await signInWithEmailAndPassword(auth, formData.email, formData.password);

      // 2) DB: verify selected role matches Firestore profile
      const uid = cred.user.uid;
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        throw new Error("User profile not found.");
      }

      const savedRole = snap.data()?.role as "customer" | "company" | "admin";
      if (savedRole !== formData.role) {
        throw new Error(`Selected role doesn't match your account role (${savedRole}).`);
      }

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      setTimeout(() => {
        if (savedRole === "company") {
          navigate("/dashboard/company");
        } else if (savedRole === "admin") {
          navigate("/dashboard/admin");
        } else if (savedRole === "customer") {
          navigate("/dashboard/customer");
        }
      }, 1000);
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err?.message || "Invalid email or password.",
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
                    onValueChange={(value) => setFormData({ ...formData, role: value as "customer" | "company" | "admin" })}
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
