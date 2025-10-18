// src/pages/Register.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types";

/* Firebase */
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    licenseNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Full Name validation
    const trimmedName = formData.name.trim().replace(/\s+/g, " ");
    if (!trimmedName) {
      newErrors.name = "Please enter your full name (first and last name).";
    } else if (trimmedName.split(" ").length < 2) {
      newErrors.name = "Please enter your full name (first and last name).";
    } else if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
      newErrors.name = "Please enter your full name (first and last name).";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Please enter a valid email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Phone validation
    const phoneDigits = formData.phone.replace(/[^\d]/g, "");
    if (!formData.phone.trim()) {
      newErrors.phone = "Please enter a valid phone number.";
    } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      newErrors.phone = "Please enter a valid phone number.";
    }

    // Company-specific validations
    if (selectedRole === "company") {
      if (!formData.location.trim()) {
        newErrors.location = "Location is required.";
      } else if (formData.location.trim().length < 2 || formData.location.trim().length > 100) {
        newErrors.location = "Location must be between 2 and 100 characters.";
      } else if (!/^[a-zA-Z0-9\s,\-]+$/.test(formData.location)) {
        newErrors.location = "Location contains invalid characters.";
      }

      const licenseDigits = formData.licenseNumber.replace(/[^\d]/g, "");
      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = "License number is required.";
      } else if (licenseDigits.length < 5 || licenseDigits.length > 15) {
        newErrors.licenseNumber = "License number must be 5 to 15 digits.";
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password =
        "Password must be at least 8 characters and include uppercase, lowercase, a number and a special character.";
    } else if (formData.password.length < 8) {
      newErrors.password =
        "Password must be at least 8 characters and include uppercase, lowercase, a number and a special character.";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/.test(formData.password)) {
      newErrors.password =
        "Password must be at least 8 characters and include uppercase, lowercase, a number and a special character.";
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Mock check preserved
    if (formData.email === "existing@example.com") {
      toast({
        title: "Registration Failed",
        description: "This account already exists.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1) Create Auth user
      const cred = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);

      // 2) Send email verification (🔑 REQUIRED FOR YOUR FLOW)
      await sendEmailVerification(cred.user);

      // 3) Optional: set display name
      try {
        await updateProfile(cred.user, { displayName: formData.name.trim() });
      } catch {}

      // 4) Create Firestore profile with doc ID = uid (matches rules)
      const uid = cred.user.uid;

      if (selectedRole === "company") {
        await setDoc(doc(db, "company", uid), {
          companyId: `C${uid.slice(0, 3).toUpperCase()}`,
          companyName: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          licenseNumber: formData.licenseNumber.trim(),
          Location: formData.location.trim(),
          role: "company",
          uid,
        });
      } else {
        await setDoc(doc(db, "Customer", uid), {
          customerID: `Cu${uid.slice(0, 3).toUpperCase()}`,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: "customer",
          uid,
        });
      }

      toast({
        title: "Registration Successful",
        description: "We sent a verification link to your email. Please verify before logging in.",
      });

      // 🔁 Send user to Login so they can verify then sign in
      navigate("/login");
    } catch (err: any) {
      const message =
        err?.code === "permission-denied"
          ? "Missing or insufficient Firestore permissions."
          : err?.code === "auth/email-already-in-use"
          ? "This email is already registered."
          : err?.code === "auth/weak-password"
          ? "Please choose a stronger password."
          : err?.message || "Registration failed. Please try again.";

      toast({ title: "Registration Failed", description: message, variant: "destructive" });
    }
  };

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">Join AqarVerse</h1>
              <p className="text-lg text-muted-foreground">Select your account type</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card
                className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group"
                onClick={() => setSelectedRole("company")}
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Real Estate Company</CardTitle>
                  <CardDescription>Upload and manage 3D property models for review and approval</CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group"
                onClick={() => setSelectedRole("customer")}
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                    <User className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <CardTitle>Customer</CardTitle>
                  <CardDescription>Browse and explore 3D property models</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create {selectedRole === "company" ? "Company" : "Customer"} Account</CardTitle>
              <CardDescription>Fill in your details to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={errors.name ? "border-destructive" : ""}
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={errors.email ? "border-destructive" : ""}
                    placeholder="john@example.com"
                  />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={errors.phone ? "border-destructive" : ""}
                    placeholder="+966 50 123 4567"
                  />
                  {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                </div>

                {selectedRole === "company" && (
                  <>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className={errors.location ? "border-destructive" : ""}
                        placeholder="Riyadh, Saudi Arabia"
                      />
                      {errors.location && <p className="text-sm text-destructive mt-1">{errors.location}</p>}
                    </div>

                    <div>
                      <Label htmlFor="license">License Number</Label>
                      <Input
                        id="license"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                        className={errors.licenseNumber ? "border-destructive" : ""}
                        placeholder="12345678"
                      />
                      {errors.licenseNumber && <p className="text-sm text-destructive mt-1">{errors.licenseNumber}</p>}
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={errors.password ? "border-destructive" : ""}
                    placeholder="••••••••"
                  />
                  {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={errors.confirmPassword ? "border-destructive" : ""}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setSelectedRole(null)} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" className="flex-1">
                    Register
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Register;
