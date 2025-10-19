import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export default function ForgotPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [working, setWorking] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (working) return;
    setWorking(true);
    try {
      // If you’ve set your Email Action URL to /reset-password in Firebase Console,
      // you can omit actionCodeSettings. Otherwise, you may pass it here.
      await sendPasswordResetEmail(auth, email.trim());
      toast({
        title: "Email sent",
        description:
          "Check your inbox for a password reset link. Open it and follow the instructions.",
      });
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast({
        title: "Could not send email",
        description:
          err?.code === "auth/user-not-found"
            ? "No account exists with that email."
            : err?.message || "Please try again.",
        variant: "destructive",
      });
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
              <CardTitle>Forgot Password</CardTitle>
              <CardDescription>We’ll email you a reset link</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={working}>
                  {working ? "Sending…" : "Send Reset Link"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  Back to Login
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
