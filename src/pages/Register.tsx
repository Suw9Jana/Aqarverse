import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, User, MailCheck, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

/* Firebase */
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,               // ⬅️ أضفناه هنا
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

/* ---------------- Phone options & helpers ---------------- */
type CountryOption = {
  code: string; // dialing code
  label: string; // country name
  nationalMax: number; // max digits for national portion
  requireLeading5?: boolean; // KSA rule
  flag: string; // emoji (swap to SVG if you prefer)
};

const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "+966", label: "Saudi Arabia", nationalMax: 9, requireLeading5: true, flag: "🇸🇦" },
  { code: "+971", label: "United Arab Emirates", nationalMax: 9, flag: "🇦🇪" },
  { code: "+965", label: "Kuwait", nationalMax: 8, flag: "🇰🇼" },
  { code: "+974", label: "Qatar", nationalMax: 8, flag: "🇶🇦" },
  { code: "+973", label: "Bahrain", nationalMax: 8, flag: "🇧🇭" },
  { code: "+20", label: "Egypt", nationalMax: 10, flag: "🇪🇬" },
];

const getCountry = (code: string) =>
  COUNTRY_OPTIONS.find((c) => c.code === code) || COUNTRY_OPTIONS[0];

/* --------------------------------------------------------- */

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    confirmEmail: "",
    // phone is now split:
    phoneCode: "+966",
    phoneNational: "",

    location: "",
    licenseNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // helper: set/clear a single field error (used for live validation)
  const setFieldError = (field: string, message?: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (!message) {
        delete next[field];
      } else {
        next[field] = message;
      }
      return next;
    });
  };

  /* ---------- Derived password rule booleans for UI ---------- */
  const password = formData.password || "";
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&#]/.test(password);

  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.confirmPassword === formData.password;

  /* ---------------- Validation ---------------- */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Full Name
    const trimmedName = formData.name.trim().replace(/\s+/g, " ");
    if (!trimmedName || trimmedName.split(" ").length < 2 || !/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
      newErrors.name = "Please enter your full name (first and last name).";
    }

    // Email & Confirm
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!formData.confirmEmail.trim()) {
      newErrors.confirmEmail = "Please re-enter your email.";
    } else if (
      formData.email.trim().toLowerCase() !==
      formData.confirmEmail.trim().toLowerCase()
    ) {
      newErrors.confirmEmail = "Emails do not match.";
    }

    // Phone
    const country = getCountry(formData.phoneCode);
    const nationalDigits = formData.phoneNational.replace(/\D/g, "");
    if (!nationalDigits) {
      newErrors.phone = "Please enter a valid phone number.";
    } else {
      if (nationalDigits.length > country.nationalMax) {
        newErrors.phone = `Phone number too long. Max ${country.nationalMax} digits.`;
      }
      if (country.requireLeading5 && !nationalDigits.startsWith("5")) {
        newErrors.phone = "For +966, start with 5 (not 05).";
      }
      // Also disallow a leading 0 in national part for all countries
      if (/^0/.test(nationalDigits)) {
        newErrors.phone = "Do not include a leading 0 in the national number.";
      }
      // Minimal sanity: at least 6 digits for non-KSA, 9 for KSA
      const min = country.requireLeading5 ? 9 : Math.min(country.nationalMax, 6);
      if (nationalDigits.length < min) {
        newErrors.phone = "Please enter a valid phone number.";
      }
    }

    // Company fields
    if (selectedRole === "company") {
      if (
        !formData.location.trim() ||
        formData.location.trim().length < 2 ||
        formData.location.trim().length > 100 ||
        !/^[a-zA-Z0-9\s,\-]+$/.test(formData.location)
      ) {
        newErrors.location = "Location must be 2–100 valid characters.";
      }
      const licenseDigits = formData.licenseNumber.replace(/[^\d]/g, "");
      if (!formData.licenseNumber.trim() || licenseDigits.length < 5 || licenseDigits.length > 15) {
        newErrors.licenseNumber = "License number must be 5 to 15 digits.";
      }
    }

    // Password: must satisfy all rules
    const passwordValid =
      hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
    if (!passwordValid) {
      newErrors.password = "Password does not meet all requirements.";
    }

    if (!formData.confirmPassword || formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Prevent duplicates (mock kept)
    if (formData.email === "existing@example.com") {
      toast({
        title: "Registration Failed",
        description: "This account already exists.",
        variant: "destructive",
      });
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );

      await sendEmailVerification(cred.user);
      try {
        await updateProfile(cred.user, { displayName: formData.name.trim() });
      } catch {}

      const uid = cred.user.uid;

      // Build E.164 phone
      const country = getCountry(formData.phoneCode);
      const nationalDigits = formData.phoneNational.replace(/\D/g, "");
      const phoneE164 = `${country.code}${nationalDigits}`;

      if (selectedRole === "company") {
        await setDoc(doc(db, "company", uid), {
          companyId: `C${uid.slice(0, 3).toUpperCase()}`,
          companyName: formData.name.trim(),
          email: formData.email.trim(),
          phone: phoneE164,
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
          phone: phoneE164,
          role: "customer",
          uid,
        });
      }

      // 🔔 Toast مع أيقونة الإيميل
      toast({
        title: "Registration Successful",
        description: (
          <div className="flex items-center gap-2">
            <MailCheck className="h-5 w-5 text-primary" />
            <span>
              A verification link has been sent to your email. Please verify your email before
              logging in.
            </span>
          </div>
        ),
        duration: 10000,
      });

      // 🔒 مهم: نسوي تسجيل خروج لأن Firebase يسجل الدخول تلقائي بعد التسجيل
      await signOut(auth);

      // 👉 بعدها نودّيه لصفحة اللوق إن وهو Guest
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

      toast({
        title: "Registration Failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  /* ---------------- Handlers ---------------- */
  const onChangePhoneCode = (val: string) => {
    setFormData((p) => ({ ...p, phoneCode: val }));
    if (errors.phone) setErrors((e) => ({ ...e, phone: "" }));
  };

  const onChangePhoneNational = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    const max = getCountry(formData.phoneCode).nationalMax;
    setFormData((p) => ({ ...p, phoneNational: digitsOnly.slice(0, max) }));
    if (errors.phone) setErrors((er) => ({ ...er, phone: "" }));
  };

  /* ---------------- Small UI helper ---------------- */
  const RuleItem = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-xs">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      ) : (
        <XCircle className="h-4 w-4 text-destructive" />
      )}
      <span className={ok ? "text-emerald-600" : "text-muted-foreground"}>{label}</span>
    </div>
  );

  /* ---------------- UI ---------------- */
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
                  <CardDescription>
                    Upload and manage 3D property models for review and approval
                  </CardDescription>
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
              <CardTitle>
                Create {selectedRole === "company" ? "Company" : "Customer"} Account
              </CardTitle>
              <CardDescription>Fill in your details to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={errors.name ? "border-destructive" : ""}
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={errors.email ? "border-destructive" : ""}
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmEmail">Confirm Email *</Label>
                  <Input
                    id="confirmEmail"
                    type="email"
                    value={formData.confirmEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmEmail: e.target.value })
                    }
                    className={errors.confirmEmail ? "border-destructive" : ""}
                    placeholder="Re-enter your email"
                  />
                  {errors.confirmEmail && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.confirmEmail}
                    </p>
                  )}
                </div>

                {/* Phone: country code + national number */}
                <div>
                  <Label>Phone Number *</Label>
                  <div className="flex gap-2 items-center">
                    <Select
                      value={formData.phoneCode}
                      onValueChange={onChangePhoneCode}
                    >
                      <SelectTrigger className="w-40">
                        <div className="flex items-center gap-2">
                          <span>{getCountry(formData.phoneCode).flag}</span>
                          <span className="font-medium">
                            {getCountry(formData.phoneCode).code}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_OPTIONS.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            <span className="inline-flex items-center gap-2">
                              <span>{c.flag}</span>
                              <span className="font-medium">{c.code}</span>
                              <span className="text-muted-foreground ml-2 hidden md:inline">
                                {c.label}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      inputMode="numeric"
                      pattern="\d*"
                      value={formData.phoneNational}
                      onChange={onChangePhoneNational}
                      placeholder={
                        getCountry(formData.phoneCode).code === "+966"
                          ? "5XXXXXXXX"
                          : "national number"
                      }
                      className={`flex-1 ${
                        errors.phone ? "border-destructive" : ""
                      }`}
                      maxLength={getCountry(formData.phoneCode).nationalMax}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getCountry(formData.phoneCode).code === "+966"
                      ? "Start with 5 (not 05). 9 digits total."
                      : `Up to ${
                          getCountry(formData.phoneCode).nationalMax
                        } digits.`}
                  </p>
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.phone}
                    </p>
                  )}
                </div>

                {selectedRole === "company" && (
                  <>
                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        className={errors.location ? "border-destructive" : ""}
                        placeholder="Riyadh, Saudi Arabia"
                      />
                      {errors.location && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.location}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="license">License Number *</Label>
                      <Input
                        id="license"
                        value={formData.licenseNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            licenseNumber: e.target.value,
                          })
                        }
                        className={errors.licenseNumber ? "border-destructive" : ""}
                        placeholder="12345678"
                      />
                      {errors.licenseNumber && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.licenseNumber}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Password with visual checklist */}
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({ ...prev, password: value }));

                      // keep error in sync: if any rule fails, show a general error
                      const okNow =
                        value.length >= 8 &&
                        /[A-Z]/.test(value) &&
                        /[a-z]/.test(value) &&
                        /\d/.test(value) &&
                        /[@$!%*?&#]/.test(value);
                      if (!value) {
                        setFieldError("password", "Password is required.");
                      } else if (!okNow) {
                        setFieldError(
                          "password",
                          "Password does not meet all requirements."
                        );
                      } else {
                        setFieldError("password");
                      }

                      // If confirm password is already filled, re-check match
                      if (formData.confirmPassword) {
                        if (value !== formData.confirmPassword) {
                          setFieldError(
                            "confirmPassword",
                            "Passwords do not match."
                          );
                        } else {
                          setFieldError("confirmPassword");
                        }
                      }
                    }}
                    className={errors.password ? "border-destructive" : ""}
                    placeholder="••••••••"
                  />

                  {/* Visual checklist */}
                  <div className="mt-2 space-y-1 rounded-md bg-muted/40 p-2">
                    <RuleItem ok={hasMinLength} label="At least 8 characters" />
                    <RuleItem
                      ok={hasUpper}
                      label="Contains an uppercase letter (A–Z)"
                    />
                    <RuleItem
                      ok={hasLower}
                      label="Contains a lowercase letter (a–z)"
                    />
                    <RuleItem
                      ok={hasNumber}
                      label="Contains a number (0–9)"
                    />
                    <RuleItem
                      ok={hasSpecial}
                      label="Contains a special character (@$!%*?&#)"
                    />
                  </div>

                  {errors.password && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password with match indicator */}
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        confirmPassword: value,
                      }));

                      if (!value) {
                        setFieldError(
                          "confirmPassword",
                          "Please confirm your password."
                        );
                      } else if (value !== formData.password) {
                        setFieldError(
                          "confirmPassword",
                          "Passwords do not match."
                        );
                      } else {
                        setFieldError("confirmPassword");
                      }
                    }}
                    className={errors.confirmPassword ? "border-destructive" : ""}
                    placeholder="••••••••"
                  />

                  {formData.confirmPassword.length > 0 && (
                    <div className="mt-2">
                      <RuleItem
                        ok={passwordsMatch}
                        label={
                          passwordsMatch
                            ? "Passwords match"
                            : "Passwords do not match"
                        }
                      />
                    </div>
                  )}

                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedRole(null)}
                    className="flex-1"
                  >
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
