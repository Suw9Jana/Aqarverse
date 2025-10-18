import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
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

  // Role can be passed in URL (?role=customer|company); we'll verify against Firestore
  const initialRole = (searchParams.get("role") as Role) || "customer";

  const [role, setRole] = useState<Role>(initialRole);
  const [loading, setLoading] = useState(true);
  const [initialEmail, setInitialEmail] = useState(""); // Auth email at load (for comparisons)

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

  const [errors, setErrors] = useState<Record<string, string>>({});

  /* -------------------------- Load profile on mount ------------------------- */
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

        // Try Customer first
        const custSnap = await getDoc(doc(db, "Customer", uid));
        if (custSnap.exists()) {
          const d = custSnap.data() as any;
          setRole("customer");
          setFormData((prev) => ({
            ...prev,
            fullName: d?.name || "",
            email: user.email || d?.email || "",
            phone: d?.phone || "",
            location: "",
            licenseNumber: "",
          }));
          setInitialEmail(user.email || d?.email || "");
          setLoading(false);
          return;
        }

        // Then Company
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

  /* ------------------------------- Validation ------------------------------- */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Full Name validation
    const trimmedName = formData.fullName.trim().replace(/\s+/g, " ");
    const nameParts = trimmedName.split(" ");
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Please enter your full name (first and last name).";
    } else if (nameParts.length < 2) {
      newErrors.fullName = "Please enter your full name (first and last name).";
    } else if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
      newErrors.fullName = "Please enter your full name (first and last name).";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Please enter a valid email address.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Phone validation
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (!formData.phone.trim()) {
      newErrors.phone = "Please enter a valid phone number.";
    } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      newErrors.phone = "Please enter a valid phone number.";
    }

    // Company-specific
    if (role === "company") {
      if (!formData.location.trim()) {
        newErrors.location = "Please enter your location.";
      } else if (formData.location.trim().length < 2 || formData.location.trim().length > 100) {
        newErrors.location = "Please enter your location.";
      } else if (!/^[a-zA-Z0-9\s,'-]+$/.test(formData.location)) {
        newErrors.location = "Please enter your location.";
      }

      const licenseDigits = formData.licenseNumber.replace(/\D/g, "");
      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = "Please enter your license number.";
      } else if (licenseDigits.length < 5 || licenseDigits.length > 15) {
        newErrors.licenseNumber = "Please enter your license number.";
      }
    }

    // Password change (optional)
    const wantsPasswordChange = Boolean(formData.oldPassword || formData.password || formData.confirmPassword);
    if (wantsPasswordChange) {
      if (!formData.oldPassword) {
        newErrors.oldPassword = "Current password is required to change your password.";
      }
      if (!formData.password) {
        newErrors.password = "Please enter a new password.";
      } else {
        const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        if (!pwRegex.test(formData.password)) {
          newErrors.password =
            "Password must be at least 8 characters and include uppercase, lowercase, a number and a special character.";
        }
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your new password.";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------------------------- Save --------------------------------- */
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
      // If email changed or user wants to change password, we must reauthenticate
      const wantsPasswordChange = Boolean(formData.password);
      if (emailChanged || wantsPasswordChange) {
        if (!formData.oldPassword) {
          throw new Error("Please enter your current password to update email or password.");
        }
        const cred = EmailAuthProvider.credential(initialEmail || user.email!, formData.oldPassword);
        await reauthenticateWithCredential(user, cred);
      }

      // Update email in Auth if changed
      if (emailChanged) {
        await updateEmail(user, formData.email.trim());
      }

      // Update password in Auth if requested
      if (formData.password) {
        await updatePassword(user, formData.password);
      }

      // Update Firestore doc
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

      // Navigate back to dashboard
      navigate(role === "company" ? "/dashboard/company" : "/dashboard/customer");
    } catch (err: any) {
      const message =
        err?.code === "auth/requires-recent-login"
          ? "For security, please re-enter your current password and try again."
          : err?.code === "permission-denied"
          ? "Missing or insufficient Firestore permissions."
          : err?.message || "Update failed. Please try again.";

      // If reauth fails, sign out to avoid weird session state
      if (err?.code === "auth/requires-recent-login") {
        try {
          await signOut(auth);
        } catch {}
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
                    {errors.licenseNumber && (
                      <p className="text-sm text-destructive">{errors.licenseNumber}</p>
                    )}
                  </div>
                </>
              )}

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-4">Change Password / Email (Optional)</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="oldPassword">Current Password</Label>
                    <Input
                      id="oldPassword"
                      name="oldPassword"
                      type="password"
                      value={formData.oldPassword}
                      onChange={handleChange}
                      placeholder="Required if changing email or password"
                      className={errors.oldPassword ? "border-destructive" : ""}
                    />
                    {errors.oldPassword && <p className="text-sm text-destructive">{errors.oldPassword}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current password"
                      className={errors.password ? "border-destructive" : ""}
                    />
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your new password"
                      className={errors.confirmPassword ? "border-destructive" : ""}
                    />
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
