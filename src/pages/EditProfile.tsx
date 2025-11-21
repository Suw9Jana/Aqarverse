import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Eye, EyeOff, Upload } from "lucide-react";
import logo from "@/assets/aqarverse_logo.jpg";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

/* Firebase */
import { auth, db, storage } from "@/lib/firebase";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";

/* ---------------- Phone options & helpers ---------------- */
type CountryOption = {
  code: string;
  label: string;
  nationalMax: number;
  requireLeading5?: boolean;
  flag: string;
};

const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "+966", label: "Saudi Arabia", nationalMax: 9, requireLeading5: true, flag: "🇸🇦" },
  { code: "+971", label: "United Arab Emirates", nationalMax: 9, flag: "🇦🇪" },
  { code: "+965", label: "Kuwait", nationalMax: 8, flag: "🇰🇼" },
  { code: "+974", label: "Qatar", nationalMax: 8, flag: "🇶🇦" },
  { code: "+973", label: "Bahrain", nationalMax: 8, flag: "🇧🇭" },
  { code: "+20",  label: "Egypt", nationalMax: 10, flag: "🇪🇬" },
];

const getCountry = (code: string) =>
  COUNTRY_OPTIONS.find((c) => c.code === code) || COUNTRY_OPTIONS[0];

/* ---------------- FIXED — NEW WORKING VERSION ---------------- */
function splitE164(phone?: string): { phoneCode: string; phoneNational: string } {
  if (!phone) return { phoneCode: "+966", phoneNational: "" };

  if (!phone.startsWith("+")) {
    const digitsOnly = phone.replace(/\D/g, "");
    return {
      phoneCode: "+966",
      phoneNational: digitsOnly.slice(0, getCountry("+966").nationalMax),
    };
  }

  const digits = phone.slice(1).replace(/\D/g, "");

  const sortedOptions = [...COUNTRY_OPTIONS].sort(
    (a, b) => b.code.length - a.code.length
  );

  let matchedOption = getCountry("+966");
  let national = "";

  for (const opt of sortedOptions) {
    const codeDigits = opt.code.slice(1);
    if (digits.startsWith(codeDigits)) {
      matchedOption = opt;
      national = digits.slice(codeDigits.length);
      break;
    }
  }

  if (!national) national = digits;

  return {
    phoneCode: matchedOption.code,
    phoneNational: national.slice(0, matchedOption.nationalMax),
  };
}
/* --------------------------------------------------------- */

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
    phoneCode: "+966",
    phoneNational: "",
    location: "",
    licenseNumber: "",
    oldPassword: "",
    password: "",
    confirmPassword: "",
  });

  const [companyPhotoFile, setCompanyPhotoFile] = useState<File | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pwOpen, setPwOpen] = useState(false);

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
          const split = splitE164(d?.phone || user.phoneNumber || "");

          setFormData((prev) => ({
            ...prev,
            fullName: d?.name || "",
            email: user.email || d?.email || "",
            phoneCode: split.phoneCode,
            phoneNational: split.phoneNational,
          }));
          setInitialEmail(user.email || d?.email || "");
          setLoading(false);
          return;
        }

        const compSnap = await getDoc(doc(db, "company", uid));
        if (compSnap.exists()) {
          const d = compSnap.data() as any;
          setRole("company");

          const split = splitE164(d?.phone || user.phoneNumber || "");

          setFormData((prev) => ({
            ...prev,
            fullName: d?.companyName || "",
            email: user.email || d?.email || "",
            phoneCode: split.phoneCode,
            phoneNational: split.phoneNational,
            location: d?.Location || d?.location || "",
            licenseNumber: d?.licenseNumber || "",
          }));

          setExistingPhotoUrl(d?.photoUrl || d?.photoURL || "");
          setPhotoPreview(d?.photoUrl || d?.photoURL || "");

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
  }, []);

  /* ---------------- Validation ---------------- */
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

    // Phone validation
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
      if (/^0/.test(nationalDigits)) {
        newErrors.phone = "Do not include a leading 0 in the national number.";
      }
      const min = country.requireLeading5 ? 9 : Math.min(country.nationalMax, 6);
      if (nationalDigits.length < min) {
        newErrors.phone = "Please enter a valid phone number.";
      }
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

    if (companyPhotoFile) {
      const allowed = ["image/png", "image/jpeg", "image/webp"];
      if (!allowed.includes(companyPhotoFile.type)) newErrors.companyPhoto = "Image must be PNG/JPEG/WEBP.";
      if (companyPhotoFile.size > 5 * 1024 * 1024) newErrors.companyPhoto = "Image size exceeds 5MB.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- Submit ---------------- */
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
        if (!formData.oldPassword)
          throw new Error("Please enter your current password to update email or password.");

        const cred = EmailAuthProvider.credential(initialEmail || user.email!, formData.oldPassword);
        await reauthenticateWithCredential(user, cred);
      }

      if (emailChanged) await updateEmail(user, formData.email.trim());
      if (formData.password) await updatePassword(user, formData.password);

      // Build E.164
      const country = getCountry(formData.phoneCode);
      const nationalDigits = formData.phoneNational.replace(/\D/g, "");
      const phoneE164 = `${country.code}${nationalDigits}`;

      if (role === "customer") {
        await updateDoc(doc(db, "Customer", uid), {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: phoneE164,
          updatedAt: serverTimestamp(),
        });
      } else {
        let photoUrlToSave = existingPhotoUrl;

        if (companyPhotoFile) {
          setUploadingPhoto(true);
          const safeName = companyPhotoFile.name.replace(/\s+/g, "_");
          const path = `company-photos/${uid}/${Date.now()}_${safeName}`;
          const r = sRef(storage, path);

          await uploadBytes(r, companyPhotoFile, { contentType: companyPhotoFile.type || undefined });
          photoUrlToSave = await getDownloadURL(r);
          setUploadingPhoto(false);
        }

        await updateDoc(doc(db, "company", uid), {
          companyName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: phoneE164,
          Location: formData.location.trim(),
          licenseNumber: formData.licenseNumber.trim(),
          ...(photoUrlToSave ? { photoUrl: photoUrlToSave } : {}),
          updatedAt: serverTimestamp(),
        });
      }

      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      setPwOpen(false);
      navigate(role === "company" ? "/dashboard/company" : "/dashboard/customer");
    } catch (err: any) {
      const message =
        err?.code === "auth/requires-recent-login"
          ? "For security, please re-enter your current password and try again."
          : err?.code === "permission-denied"
          ? "Missing or insufficient Firestore permissions."
          : err?.message || "Update failed. Please try again.";

      if (err?.code === "auth/requires-recent-login") {
        try {
          await signOut(auth);
        } catch {}
      }

      setUploadingPhoto(false);
      toast({ title: "Update Failed", description: message, variant: "destructive" });
    }
  };

  /* ---------------- Handlers ---------------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const onPickCompanyPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setCompanyPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));

    setErrors((prev) => ({ ...prev, companyPhoto: "" }));
  };

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

  /* ---------------- UI ---------------- */
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
          <Button variant="ghost" onClick={() => navigate(role === "company" ? "/dashboard/company" : "/dashboard/customer")}>
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
            <form id="editProfileForm" onSubmit={handleSubmit} className="space-y-6">
              
              {/* FULL NAME */}
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

              {/* EMAIL */}
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
                  disabled
                  readOnly
                  onFocus={(e) => e.currentTarget.blur()}
                  tabIndex={-1}
                  aria-disabled="true"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              {/* PHONE */}
              <div className="space-y-2">
                <Label>Phone Number *</Label>

                <div className="flex gap-2 items-center">

                  <Select value={formData.phoneCode} onValueChange={onChangePhoneCode}>
                    <SelectTrigger className="w-40">
                      <div className="flex items-center gap-2">
                        <span>{getCountry(formData.phoneCode).flag}</span>
                        <span className="font-medium">{getCountry(formData.phoneCode).code}</span>
                      </div>
                    </SelectTrigger>

                    <SelectContent>
                      {COUNTRY_OPTIONS.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <span className="inline-flex items-center gap-2">
                            <span>{c.flag}</span>
                            <span className="font-medium">{c.code}</span>
                            <span className="text-muted-foreground ml-2 hidden md:inline">{c.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    id="phoneNational"
                    name="phoneNational"
                    type="tel"
                    inputMode="numeric"
                    pattern="\d*"
                    value={formData.phoneNational}
                    onChange={onChangePhoneNational}
                    placeholder={
                      getCountry(formData.phoneCode).code === "+966"
                        ? "5XXXXXXXX"
                        : "national number"
                    }
                    className={`${errors.phone ? "border-destructive" : ""} flex-1`}
                    maxLength={getCountry(formData.phoneCode).nationalMax}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  {getCountry(formData.phoneCode).code === "+966"
                    ? "Start with 5 (not 05). 9 digits total."
                    : `Up to ${getCountry(formData.phoneCode).nationalMax} digits.`}
                </p>

                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              {/* COMPANY ONLY FIELDS */}
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

                  <div className="space-y-2">
                    <Label htmlFor="companyPhoto">Company Photo</Label>
                    <label htmlFor="companyPhoto" className="cursor-pointer">
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors ${
                          errors.companyPhoto ? "border-destructive" : "border-border"
                        }`}
                      >
                        <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>

                        {photoPreview && (
                          <div className="mt-3 flex justify-center">
                            <img
                              src={photoPreview}
                              alt="Preview"
                              className="h-20 w-20 rounded object-cover border"
                            />
                          </div>
                        )}

                        {uploadingPhoto && (
                          <p className="text-xs text-muted-foreground mt-2">Uploading…</p>
                        )}
                      </div>
                    </label>
                    <input
                      id="companyPhoto"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={onPickCompanyPhoto}
                      className="hidden"
                    />

                    {errors.companyPhoto && (
                      <p className="text-sm text-destructive">{errors.companyPhoto}</p>
                    )}
                  </div>
                </>
              )}

              {/* PASSWORD DIALOG */}
              <div className="pt-2">
                <Dialog open={pwOpen} onOpenChange={setPwOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="secondary">
                      Change Password
                    </Button>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>Update your password securely.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="oldPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="oldPassword"
                            name="oldPassword"
                            type={showOld ? "text" : "password"}
                            value={formData.oldPassword}
                            onChange={handleChange}
                            placeholder="Required if changing password"
                            className={`${errors.oldPassword ? "border-destructive" : ""} pr-10`}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            onClick={() => setShowOld((s) => !s)}
                          >
                            {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.oldPassword && (
                          <p className="text-sm text-destructive">{errors.oldPassword}</p>
                        )}
                      </div>

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
                          >
                            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-sm text-destructive">{errors.password}</p>
                        )}
                      </div>

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
                          >
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                        )}
                      </div>
                    </div>

                    <DialogFooter className="gap-2">
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button type="submit" form="editProfileForm">
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Button type="submit" className="w-full" disabled={uploadingPhoto}>
                <Save className="h-4 w-4 mr-2" />
                {uploadingPhoto ? "Uploading…" : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProfile;
