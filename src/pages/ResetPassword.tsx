import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const oobCode = params.get("oobCode") || "";
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  // form state
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [working, setWorking] = useState(false);

  // Verify the reset code from the link
  useEffect(() => {
    (async () => {
      try {
        const mail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(mail);
        setValid(true);
      } catch {
        setValid(false);
      } finally {
        setChecking(false);
      }
    })();
  }, [oobCode]);

  const disabled = useMemo(
    () => working || pwd.length < 8 || pwd !== pwd2,
    [working, pwd, pwd2]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    setWorking(true);
    try {
      await confirmPasswordReset(auth, oobCode, pwd);
      toast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
      });
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast({
        title: "Reset failed",
        description: err?.message || "Please try the link again.",
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
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                {checking ? "Checking your link…" : valid ? `Account: ${email ?? ""}` : "The reset link is invalid or expired."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!checking && valid && (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="pwd">New Password</Label>
                    <div className="relative">
                      <Input
                        id="pwd"
                        type={show1 ? "text" : "password"}
                        value={pwd}
                        onChange={(e) => setPwd(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShow1((s) => !s)}
                        aria-label={show1 ? "Hide password" : "Show password"}
                      >
                        {show1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pwd2">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="pwd2"
                        type={show2 ? "text" : "password"}
                        value={pwd2}
                        onChange={(e) => setPwd2(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShow2((s) => !s)}
                        aria-label={show2 ? "Hide password" : "Show password"}
                      >
                        {show2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {pwd2 && pwd !== pwd2 && (
                      <p className="text-sm text-destructive mt-1">Passwords do not match.</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={disabled}>
                    {working ? "Updating…" : "Update Password"}
                  </Button>
                </form>
              )}

              {!checking && !valid && (
                <Button variant="outline" className="w-full" onClick={() => navigate("/forgot-password")}>
                  Request a new reset link
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
