import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/aqarverse_logo.jpg";

/* Firebase */
import { auth, db } from "@/lib/firebase";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

type Role = "customer" | "company";

const EditProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get("role") as Role) || "customer";

  const [role, setRole] = useState<Role>(initialRole);
  const [loading, setLoading] = useState(true);
  const [initialEmail, setInitialEmail] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    licenseNumber: "",
    oldPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const user = auth.currentUser;
      if (!user) {
        toast({ title: "Not signed in", description: "Please log in first.", variant: "destructive" });
        navigate("/login");
        return;
      }
      try {
        const uid = user.uid;

        const custSnap = await getDoc(doc(db, "Customer", uid));
        if (custSnap.exists()) {
          const d = custSnap.data() as any;
          setRole("customer");
          setFormData((prev) => ({
            ...prev,
            fullName: d?.name || "",
            email: user.email || d?.email || "",
            phone: d?.phone || "",
          }));
          setInitialEmail(user.email || d?.email || "");
          setLoading(false);
          return;
        }

        const compSnap = await getDoc(doc(db, "company", uid));
        if (compSnap.exists()) {
          const d = compSnap.data() as any;
          setRole("company");
          setFormData((prev) => ({
            ...prev,
            fullName: d?.companyName || "",
            email: user.email || d?.email || "",
            phone: d?.phone || "",
            location: d?.Location || d?.location || "",
            licenseNumber: d?.licenseNumber || "",
          }));
          setInitialEmail(user.email || d?.email || "");
          setLoading(false);
          return;
        }

        throw new Error("Profile not found for this account.");
      } catch (err: any) {
        toast({ title: "Failed to load profile", description: err?.message || "Try again.", variant: "destructive" });
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const trimmedName = formData.fullName.trim().replace(/\s+/g, " ");
    const nameParts = trimmedName.split(" ");
    if (!formData.fullName.trim() || nameParts.length < 2 || !/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
      newErrors.fullName = "Please enter your full name (first and last name).";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (!formData.phone.trim() || phoneDigits.length < 7 || phoneDigits.length > 15) {
      newErrors.phone = "Please enter a valid phone number.";
    }
    if (role === "company") {
      if (!formData.location.trim()) newErrors.location = "Please enter your location.";
      const licenseDigits = formData.licenseNumber.replace(/\D/g, "");
      if (!formData.licenseNumber.trim() || licenseDigits.length < 5) {
        newErrors.licenseNumber = "Please enter your license number.";
      }
    }
    const wantsPasswordChange = Boolean(formData.oldPassword || formData.password || formData.confirmPassword);
    if (wantsPasswordChange) {
      if (!formData.oldPassword) newErrors.oldPassword = "Current password is required to change your password.";
      if (!formData.password) {
        newErrors.password = "Please enter a new password.";
      } else {
        const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,}$/;
        if (!pwRegex.test(formData.password)) {
          newErrors.password =
            "Password must be at least 8 characters and include uppercase, lowercase, a number and a special character.";
        }
      }
      if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your new password.";
      else if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const user = auth.currentUser;
    if (!user) {
      toast({ title: "Not signed in", description: "Please log in again.", variant: "destructive" });
      navigate("/login");
      return;
    }

    const uid = user.uid;
    const emailChanged = formData.email.trim() !== (user.email || initialEmail);

    try {
      const wantsPasswordChange = Boolean(formData.password);
      if (emailChanged || wantsPasswordChange) {
        if (!formData.oldPassword) throw new Error("Please enter your current password to update email or password.");
        const cred = EmailAuthProvider.credential(initialEmail || user.email!, formData.oldPassword);
        await reauthenticateWithCredential(user, cred);
      }

      if (emailChanged) await updateEmail(user, formData.email.trim());
      if (formData.password) await updatePassword(user, formData.password);

      if (role === "customer") {
        await updateDoc(doc(db, "Customer", uid), {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, "company", uid), {
          companyName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          Location: formData.location.trim(),
          licenseNumber: formData.licenseNumber.trim(),
          updatedAt: serverTimestamp(),
        });
      }

      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      navigate(role === "company" ? "/dashboard/company" : "/dashboard/customer");
    } catch (err: any) {
      const message =
        err?.code === "auth/requires-recent-login"
          ? "For security, please re-enter your current password and try again."
          : err?.code === "permission-denied"
          ? "Missing or insufficient Firestore permissions."
          : err?.message || "Update failed. Please try again.";

      if (err?.code === "auth/requires-recent-login") {
        try { await signOut(auth); } catch {}
      }
      toast({ title: "Update Failed", description: message, variant: "destructive" });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b bg-card">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="AqarVerse" className="h-10 w-10 object-contain" />
              <span className="text-xl font-bold text-primary">AqarVerse</span>
            </div>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <p className="text-muted-foreground">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AqarVerse" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-primary">AqarVerse</span>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate(role === "company" ? "/dashboard/company" : "/dashboard/customer")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={errors.fullName ? "border-destructive" : ""}
                />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+966 50 123 4567"
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              {/* Company-only fields */}
              {role === "company" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      name="location"
                      type="text"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="City, Country"
                      className={errors.location ? "border-destructive" : ""}
                    />
                    {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number *</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      placeholder="Enter your license number"
                      className={errors.licenseNumber ? "border-destructive" : ""}
                    />
                    {errors.licenseNumber && <p className="text-sm text-destructive">{errors.licenseNumber}</p>}
                  </div>
                </>
              )}

              {/* Password section */}
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-4">Change Password / Email (Optional)</h3>

                <div className="space-y-4">
                  {/* Current */}
                  <div className="space-y-2">
                    <Label htmlFor="oldPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="oldPassword"
                        name="oldPassword"
                        type={showOld ? "text" : "password"}
                        value={formData.oldPassword}
                        onChange={handleChange}
                        placeholder="Required if changing email or password"
                        className={`${errors.oldPassword ? "border-destructive" : ""} pr-10`}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowOld((s) => !s)}
                        aria-label={showOld ? "Hide password" : "Show password"}
                      >
                        {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.oldPassword && <p className="text-sm text-destructive">{errors.oldPassword}</p>}
                  </div>

                  {/* New */}
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showNew ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Leave blank to keep current password"
                        className={`${errors.password ? "border-destructive" : ""} pr-10`}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowNew((s) => !s)}
                        aria-label={showNew ? "Hide password" : "Show password"}
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  {/* Confirm */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter your new password"
                        className={`${errors.confirmPassword ? "border-destructive" : ""} pr-10`}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowConfirm((s) => !s)}
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProfile;
