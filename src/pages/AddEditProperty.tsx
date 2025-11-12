import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea"; // لم نعد نستخدم الوصف اليدوي
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload } from "lucide-react";
import logo from "@/assets/aqarverse_logo.jpg";

/* Firebase */
import { auth, db, storage } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ENABLE_STORAGE = true; // اتركها true لتمكين الرفع إلى Storage

type Status = "draft" | "pending_review" | "approved" | "rejected";

type PropertyDoc = {
  title?: string;
  type?: string;
  city?: string;
  neighborhood?: string;
  description?: string; // سيُولّد تلقائياً عندما تتوفر البيانات
  price?: number;
  size?: number;
  ownerUid: string;
  status: Status;

  // مواصفات منظمة
  bedrooms?: number;
  bathrooms?: number;
  kitchens?: number;
  livingRooms?: number;

  // توافقية قديمة (قد توجد في مستندات قديمة)
  hasKitchen?: boolean;
  hasLivingRoom?: boolean;

  // model file metadata
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  filePath?: string;
  fileUrl?: string;

  // image (optional)
  imageName?: string;
  imageSize?: number;
  imageType?: string;
  imagePath?: string;
  imageUrl?: string;

  createdAt?: any;
  updatedAt?: any;
};

const AddEditProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: "",
    type: "",
    city: "",
    neighborhood: "",
    price: "" as string | number,
    size: "" as string | number,

    // الحقول المنظمة
    bedrooms: "" as string | number,
    bathrooms: "" as string | number,
    kitchens: "" as string | number,
    livingRooms: "" as string | number,
  });

  const [file, setFile] = useState<File | null>(null);      // 3D model
  const [image, setImage] = useState<File | null>(null);    // optional cover image

  const [existingFileName, setExistingFileName] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(isEdit);

  // تتبع حالة الوثيقة الحالية (للإرسال للمراجعة بعد الرفض/الدرافت)
  const [docStatus, setDocStatus] = useState<Status | null>(null);

  // منع تغيّر قيم number بمجرّد تمرير العجلة أثناء الفوكس
  const preventWheelChange = (e: React.WheelEvent<HTMLInputElement>) => {
    (e.currentTarget as HTMLInputElement).blur();
  };

  /* -------------------------- Load for Edit -------------------------- */
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "Property", id));
        if (!snap.exists()) {
          toast({ title: "Not found", description: "Property does not exist.", variant: "destructive" });
          navigate("/dashboard/company");
          return;
        }
        const d = snap.data() as PropertyDoc;

        // دعم توافقية: تحويل hasKitchen/hasLivingRoom إلى أعداد إن لم توجد الحقول الجديدة
        const kitchensFromLegacy =
          typeof d.kitchens === "number"
            ? d.kitchens
            : typeof d.hasKitchen === "boolean"
            ? d.hasKitchen ? 1 : 0
            : "";
        const livingRoomsFromLegacy =
          typeof d.livingRooms === "number"
            ? d.livingRooms
            : typeof d.hasLivingRoom === "boolean"
            ? d.hasLivingRoom ? 1 : 0
            : "";

        setForm({
          title: d.title || "",
          type: d.type || "",
          city: d.city || "",
          neighborhood: d.neighborhood || "",
          price: d.price ?? "",
          size: d.size ?? "",
          bedrooms: d.bedrooms ?? "",
          bathrooms: d.bathrooms ?? "",
          kitchens: kitchensFromLegacy as any,
          livingRooms: livingRoomsFromLegacy as any,
        });
        setExistingFileName(d.fileName || "");
        setDocStatus(d.status ?? null);
      } catch (e: any) {
        toast({ title: "Load failed", description: e?.message || "Try again.", variant: "destructive" });
        navigate("/dashboard/company");
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, id, navigate, toast]);

  /* --------------------------- Validation --------------------------- */
  /**
   * للتحقق عند الحفظ. إذا كان حفظ كمسودة forDraft=true، نرخي القيود:
   * - عدم إلزام وجود الحقول، لكن لو وُجدت يجب أن تكون صحيحة.
   * للإرسال: كل الحقول المطلوبة يجب أن تكون مُدخلة وصحيحة، ويجب وجود ملف نموذج ثلاثي الأبعاد
   *   إمّا جديد (file) أو محفوظ سابقًا (existingFileName).
   */
  const validate = (forDraft: boolean) => {
    const e: Record<string, string> = {};
    const isEmpty = (v: any) => v === "" || v === null || v === undefined;

    const title = form.title.trim().replace(/\s+/g, " ");
    if (!forDraft) {
      if (!title || title.length < 3 || title.length > 100) e.title = "Please enter a valid property title.";
    } else if (title && (title.length < 3 || title.length > 100)) {
      e.title = "Please enter a valid property title.";
    }

    if (!forDraft) {
      if (isEmpty(form.type)) e.type = "Please select a property type.";
    }

    const city = form.city.trim();
    if (!forDraft) {
      if (!city || city.length < 2 || city.length > 100) e.city = "Please enter a valid city.";
    } else if (city && (city.length < 2 || city.length > 100)) {
      e.city = "Please enter a valid city.";
    }

    const neighborhood = form.neighborhood.trim();
    if (!forDraft) {
      if (!neighborhood || neighborhood.length < 2 || neighborhood.length > 100)
        e.neighborhood = "Please enter a valid neighborhood.";
    } else if (neighborhood && (neighborhood.length < 2 || neighborhood.length > 100)) {
      e.neighborhood = "Please enter a valid neighborhood.";
    }

    // Price
    if (!forDraft) {
      if (isEmpty(form.price)) {
        e.price = "Price is required.";
      } else {
        const priceNum = Number(form.price);
        if (!Number.isFinite(priceNum) || priceNum <= 0) e.price = "Enter a valid positive price.";
      }
    } else if (!isEmpty(form.price)) {
      const priceNum = Number(form.price);
      if (!Number.isFinite(priceNum) || priceNum <= 0) e.price = "Enter a valid positive price.";
    }

    // Size
    if (!forDraft) {
      if (isEmpty(form.size)) {
        e.size = "Area is required.";
      } else {
        const sizeNum = Number(form.size);
        if (!Number.isFinite(sizeNum) || sizeNum <= 0) e.size = "Enter a valid positive size.";
      }
    } else if (!isEmpty(form.size)) {
      const sizeNum = Number(form.size);
      if (!Number.isFinite(sizeNum) || sizeNum <= 0) e.size = "Enter a valid positive size.";
    }

    // Bedrooms
    if (!forDraft) {
      if (isEmpty(form.bedrooms)) {
        e.bedrooms = "Bedrooms is required.";
      } else {
        const n = Number(form.bedrooms);
        if (!Number.isInteger(n) || n < 0) e.bedrooms = "Bedrooms must be an integer ≥ 0.";
      }
    } else if (!isEmpty(form.bedrooms)) {
      const n = Number(form.bedrooms);
      if (!Number.isInteger(n) || n < 0) e.bedrooms = "Bedrooms must be an integer ≥ 0.";
    }

    // Bathrooms
    if (!forDraft) {
      if (isEmpty(form.bathrooms)) {
        e.bathrooms = "Bathrooms is required.";
      } else {
        const n = Number(form.bathrooms);
        if (!Number.isInteger(n) || n < 0) e.bathrooms = "Bathrooms must be an integer ≥ 0.";
      }
    } else if (!isEmpty(form.bathrooms)) {
      const n = Number(form.bathrooms);
      if (!Number.isInteger(n) || n < 0) e.bathrooms = "Bathrooms must be an integer ≥ 0.";
    }

    // Kitchens
    if (!forDraft) {
      if (isEmpty(form.kitchens)) {
        e.kitchens = "Kitchens is required.";
      } else {
        const n = Number(form.kitchens);
        if (!Number.isInteger(n) || n < 0) e.kitchens = "Kitchens must be an integer ≥ 0.";
      }
    } else if (!isEmpty(form.kitchens)) {
      const n = Number(form.kitchens);
      if (!Number.isInteger(n) || n < 0) e.kitchens = "Kitchens must be an integer ≥ 0.";
    }

    // Living Rooms
    if (!forDraft) {
      if (isEmpty(form.livingRooms)) {
        e.livingRooms = "Living rooms is required.";
      } else {
        const n = Number(form.livingRooms);
        if (!Number.isInteger(n) || n < 0) e.livingRooms = "Living rooms must be an integer ≥ 0.";
      }
    } else if (!isEmpty(form.livingRooms)) {
      const n = Number(form.livingRooms);
      if (!Number.isInteger(n) || n < 0) e.livingRooms = "Living rooms must be an integer ≥ 0.";
    }

    // 3D Model requirement on SUBMIT:
    // - إنشاء جديد: يجب اختيار ملف.
    // - تعديل: يجب وجود ملف جديد أو أن يكون هناك ملف محفوظ مسبقًا (existingFileName).
    if (!forDraft) {
      const hasExistingModel = Boolean(existingFileName && existingFileName.trim().length > 0);
      if ((!isEdit && !file) || (isEdit && !file && !hasExistingModel)) {
        e.file = "3D model file is required";
      }
    }
    // تحقق النوع/الحجم إذا تم اختيار ملف
    if (file) {
      const valid = [".fbx", ".glb", ".gltf"].some((ext) => file.name.toLowerCase().endsWith(ext));
      const max = 50 * 1024 * 1024;
      if (!valid) e.file = "Unsupported file type (.fbx, .glb, .gltf only).";
      else if (file.size > max) e.file = "File size exceeds 50MB.";
    }

    // image optional — validate only if provided
    if (image) {
      const iv = ["image/png", "image/jpeg", "image/webp"];
      if (!iv.includes(image.type)) e.image = "Image must be PNG/JPEG/WEBP.";
      const maxImg = 10 * 1024 * 1024;
      if (image.size > maxImg) e.image = "Image size exceeds 10MB.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ----------------------------- Helpers ---------------------------- */
  const onFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    if (f) {
      setFile(f);
      setErrors((prev) => ({ ...prev, file: "" }));
    }
  };

  const onImage = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    if (f) {
      setImage(f);
      setErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  const fileMetaForCreate = (f: File | null) => {
    if (!f) return {};
    const lower = f.name.toLowerCase();
    const fileType =
      (f.type && f.type.trim()) ||
      (lower.endsWith(".fbx")
        ? "model/fbx"
        : lower.endsWith(".glb")
        ? "model/gltf-binary"
        : lower.endsWith(".gltf")
        ? "model/gltf+json"
        : "application/octet-stream");

    return {
      fileName: f.name,
      fileSize: f.size,
      fileType,
    };
  };

  const imageMetaForCreate = (f: File | null) => {
    if (!f) return {};
    return {
      imageName: f.name,
      imageSize: f.size,
      imageType: f.type || "image/*",
    };
  };

  // Helper لرفع أي ملف وإرجاع (path, url)
  const uploadToStorage = async (f: File, pathPrefix: string) => {
    const safeName = f.name.replace(/\s+/g, "_");
    const path = `${pathPrefix}/${Date.now()}_${safeName}`;
    const r = ref(storage, path);
    await uploadBytes(r, f, { contentType: f.type || undefined });
    const url = await getDownloadURL(r);
    return { path, url };
  };

  const pluralize = (count: number, singular: string, plural: string) =>
    `${count} ${count === 1 ? singular : plural}`;

  // توليد وصف تلقائي من الحقول المنظمة (مرن: لا ينشئ وصفًا إن نقصت المعطيات)
  const buildAutoDescription = (opts: {
    bedrooms?: number;
    bathrooms?: number;
    kitchens?: number;
    livingRooms?: number;
  }) => {
    const parts: string[] = [];
    const hasCore = typeof opts.bedrooms === "number" && typeof opts.bathrooms === "number";

    if (hasCore) {
      const bed = pluralize(opts.bedrooms!, "bedroom", "bedrooms");
      const bath = pluralize(opts.bathrooms!, "bathroom", "bathrooms");
      parts.push(`Property with ${bed} and ${bath}`);
    }

    const facilities: string[] = [];
    if (typeof opts.kitchens === "number") facilities.push(pluralize(opts.kitchens, "kitchen", "kitchens"));
    if (typeof opts.livingRooms === "number")
      facilities.push(pluralize(opts.livingRooms, "living room", "living rooms"));
    if (facilities.length) {
      parts.push(`${hasCore ? "includes" : "Includes"} ${facilities.join(" and ")}`);
    }

    return parts.length ? parts.join(", ") + "." : "";
  };

  // مساعد لإضافة الحقول الموجودة فقط (للمسودات)
  const addIfPresent = (payload: Record<string, any>, key: string, value: any, transform?: (v: any) => any) => {
    const provided = value !== "" && value !== null && value !== undefined;
    if (!provided) return;
    payload[key] = transform ? transform(value) : value;
  };

  const save = async (asStatus: Status) => {
    const forDraft = asStatus === "draft";
    if (!validate(forDraft)) return;

    const user = auth.currentUser;
    if (!user) {
      toast({ title: "Not signed in", description: "Please log in again.", variant: "destructive" });
      navigate("/login");
      return;
    }

    // للأرسال: نحول القيم إلى أرقام مع تحقق كامل
    // للمسودة: سنضيف فقط ما هو مُدخل.
    const priceNum = Number(form.price);
    const sizeNum = Number(form.size);
    const bedroomsNum = Number(form.bedrooms);
    const bathroomsNum = Number(form.bathrooms);
    const kitchensNum = Number(form.kitchens);
    const livingRoomsNum = Number(form.livingRooms);

    const autoDescription = buildAutoDescription({
      bedrooms: !forDraft || form.bedrooms !== "" ? bedroomsNum : undefined,
      bathrooms: !forDraft || form.bathrooms !== "" ? bathroomsNum : undefined,
      kitchens: !forDraft || form.kitchens !== "" ? kitchensNum : undefined,
      livingRooms: !forDraft || form.livingRooms !== "" ? livingRoomsNum : undefined,
    });

    try {
      if (!isEdit) {
        // -------- CREATE --------
        let docData: PropertyDoc = {
          ownerUid: user.uid,
          status: asStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (forDraft) {
          // أضف فقط ما تم إدخاله
          addIfPresent(docData, "title", form.title.trim().replace(/\s+/g, " "));
          addIfPresent(docData, "type", form.type);
          addIfPresent(docData, "city", form.city.trim());
          addIfPresent(docData, "neighborhood", form.neighborhood.trim());
          if (autoDescription) docData.description = autoDescription;
          addIfPresent(docData, "price", form.price, Number);
          addIfPresent(docData, "size", form.size, Number);
          addIfPresent(docData, "bedrooms", form.bedrooms, Number);
          addIfPresent(docData, "bathrooms", form.bathrooms, Number);
          addIfPresent(docData, "kitchens", form.kitchens, Number);
          addIfPresent(docData, "livingRooms", form.livingRooms, Number);
        } else {
          // إرسال للمراجعة — كل الحقول الأساسية مطلوبة
          docData = {
            ...docData,
            title: form.title.trim().replace(/\s+/g, " "),
            type: form.type,
            city: form.city.trim(),
            neighborhood: form.neighborhood.trim(),
            description: autoDescription, // وصف مولّد
            price: priceNum,
            size: sizeNum,
            bedrooms: bedroomsNum,
            bathrooms: bathroomsNum,
            kitchens: kitchensNum,
            livingRooms: livingRoomsNum,
          };
        }

        // بيانات الملف/الصورة
        Object.assign(docData, fileMetaForCreate(file), imageMetaForCreate(image));

        if (ENABLE_STORAGE) {
          if (file) {
            const up = await uploadToStorage(file, `models/${user.uid}`);
            docData.filePath = up.path;
            docData.fileUrl = up.url;
          }
          if (image) {
            const upi = await uploadToStorage(image, `images/${user.uid}`);
            docData.imagePath = upi.path;
            docData.imageUrl = upi.url;
          }
        }

        await addDoc(collection(db, "Property"), docData);

        toast({
          title: asStatus === "draft" ? "Saved as Draft" : "Submitted for Review",
          description:
            asStatus === "draft"
              ? "Your property has been saved."
              : "Your property has been submitted and is pending approval.",
        });

        navigate("/dashboard/company");
        return;
      }

      // -------- EDIT --------
      if (!id) return;
      const refDoc = doc(db, "Property", id);

      let payload: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };

      if (forDraft) {
        // تحديث مسودة: أضف فقط الحقول المدخلة واجعل الحالة "draft" دائمًا
        payload.status = "draft";
        addIfPresent(payload, "title", form.title.trim().replace(/\s+/g, " "));
        addIfPresent(payload, "type", form.type);
        addIfPresent(payload, "city", form.city.trim());
        addIfPresent(payload, "neighborhood", form.neighborhood.trim());
        if (autoDescription) payload.description = autoDescription;
        addIfPresent(payload, "price", form.price, Number);
        addIfPresent(payload, "size", form.size, Number);
        addIfPresent(payload, "bedrooms", form.bedrooms, Number);
        addIfPresent(payload, "bathrooms", form.bathrooms, Number);
        addIfPresent(payload, "kitchens", form.kitchens, Number);
        addIfPresent(payload, "livingRooms", form.livingRooms, Number);
      } else {
        // إرسال للمراجعة: كل شيء صارم
        payload = {
          ...payload,
          title: form.title.trim().replace(/\s+/g, " "),
          type: form.type,
          city: form.city.trim(),
          neighborhood: form.neighborhood.trim(),
          description: autoDescription,
          price: priceNum,
          size: sizeNum,
          bedrooms: bedroomsNum,
          bathrooms: bathroomsNum,
          kitchens: kitchensNum,
          livingRooms: livingRoomsNum,
          // تغيير الحالة إلى pending_review فقط عند الإرسال
          status: "pending_review",
        };
      }

      if (file) {
        const meta = fileMetaForCreate(file);
        Object.keys(meta).forEach((k) => {
          // @ts-expect-error runtime clean
          if (meta[k] === undefined) delete meta[k];
        });
        Object.assign(payload, meta);

        if (ENABLE_STORAGE) {
          const up = await uploadToStorage(file, `models/${user.uid}`);
          payload.filePath = up.path;
          payload.fileUrl = up.url;
        }
      }

      if (image) {
        const im = imageMetaForCreate(image);
        Object.keys(im).forEach((k) => {
          // @ts-expect-error runtime clean
          if (im[k] === undefined) delete im[k];
        });
        Object.assign(payload, im);

        if (ENABLE_STORAGE) {
          const upi = await uploadToStorage(image, `images/${user.uid}`);
          payload.imagePath = upi.path;
          payload.imageUrl = upi.url;
        }
      }

      await updateDoc(refDoc, payload);

      if (payload.status) setDocStatus(payload.status as Status);

      toast({ title: "Property updated", description: "Your changes have been saved." });
      navigate("/dashboard/company");
    } catch (err: any) {
      console.error("Add/Edit property failed:", err);
      toast({
        title: "Failed",
        description:
          err?.code === "invalid-argument"
            ? "Some fields are invalid (e.g., empty or not a number). Please fix and try again."
            : err?.code === "permission-denied"
            ? "You don't have permission to change this property."
            : err?.message || "Could not save property.",
        variant: "destructive",
      });
    }
  };

  /* ------------------------------ UI ------------------------------ */
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b bg-card">
          <div className="container mx-auto px-4 h-16 flex items-center">
            <div className="flex items-center gap-3">
              <img src={logo} alt="AqarVerse" className="h-10 w-10 object-contain" />
              <span className="text-xl font-bold text-primary">AqarVerse</span>
            </div>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AqarVerse" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-primary">AqarVerse</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard/company")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Properties
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? "Edit Property" : "Add New Property"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="title">Property Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Luxury Marina Apartment"
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="type">Property Type *</Label>
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                <SelectTrigger className={errors.type ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="Villa">Villa</SelectItem>
                  <SelectItem value="Townhouse">Townhouse</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Land">Land</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-destructive mt-1">{errors.type}</p>}
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g., Dubai"
                className={errors.city ? "border-destructive" : ""}
              />
              {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
            </div>

            <div>
              <Label htmlFor="neighborhood">District *</Label>
              <Input
                id="neighborhood"
                value={form.neighborhood}
                onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                placeholder="e.g., Marina"
                className={errors.neighborhood ? "border-destructive" : ""}
              />
              {errors.neighborhood && <p className="text-sm text-destructive mt-1">{errors.neighborhood}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  inputMode="decimal"
                  onWheel={preventWheelChange}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className={errors.price ? "border-destructive" : ""}
                />
                {errors.price && <p className="text-sm text-destructive mt-1">{errors.price}</p>}
              </div>
              <div>
                <Label htmlFor="size">Area (m²) *</Label>
                <Input
                  id="size"
                  type="number"
                  inputMode="decimal"
                  onWheel={preventWheelChange}
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  className={errors.size ? "border-destructive" : ""}
                />
                {errors.size && <p className="text-sm text-destructive mt-1">{errors.size}</p>}
              </div>
            </div>

            {/* الحقول المنظمة الجديدة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedrooms">Bedrooms *</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  onWheel={preventWheelChange}
                  value={form.bedrooms}
                  onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                  className={errors.bedrooms ? "border-destructive" : ""}
                />
                {errors.bedrooms && <p className="text-sm text-destructive mt-1">{errors.bedrooms}</p>}
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms *</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  onWheel={preventWheelChange}
                  value={form.bathrooms}
                  onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                  className={errors.bathrooms ? "border-destructive" : ""}
                />
                {errors.bathrooms && <p className="text-sm text-destructive mt-1">{errors.bathrooms}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kitchens">Kitchens *</Label>
                <Input
                  id="kitchens"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  onWheel={preventWheelChange}
                  value={form.kitchens}
                  onChange={(e) => setForm({ ...form, kitchens: e.target.value })}
                  className={errors.kitchens ? "border-destructive" : ""}
                />
                {errors.kitchens && <p className="text-sm text-destructive mt-1">{errors.kitchens}</p>}
              </div>
              <div>
                <Label htmlFor="livingRooms">Living Rooms *</Label>
                <Input
                  id="livingRooms"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  onWheel={preventWheelChange}
                  value={form.livingRooms}
                  onChange={(e) => setForm({ ...form, livingRooms: e.target.value })}
                  className={errors.livingRooms ? "border-destructive" : ""}
                />
                {errors.livingRooms && <p className="text-sm text-destructive mt-1">{errors.livingRooms}</p>}
              </div>
            </div>

            {/* أزلنا Textarea للوصف الحر — سيُولّد تلقائياً عند الحفظ */}

            <div>
              <Label htmlFor="model">3D Model (.fbx, .glb, .gltf) *</Label>
              <div className="mt-2">
                <label htmlFor="model" className="cursor-pointer">
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors ${
                      errors.file ? "border-destructive" : "border-border"
                    }`}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {file ? file.name : existingFileName || "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Maximum file size: 50MB</p>
                    {!ENABLE_STORAGE && (
                      <p className="text-xs text-muted-foreground mt-1">Storage disabled — only file metadata will be saved.</p>
                    )}
                  </div>
                </label>
                <input id="model" type="file" accept=".fbx,.glb,.gltf" onChange={onFile} className="hidden" />
              </div>
              {errors.file && <p className="text-sm text-destructive mt-1">{errors.file}</p>}
            </div>

            {/* صورة اختيارية */}
            <div>
              <Label htmlFor="image">Property Image (PNG/JPEG/WEBP) — optional</Label>
              <div className="mt-2">
                <label htmlFor="image" className="cursor-pointer">
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors ${
                      errors.image ? "border-destructive" : "border-border"
                    }`}
                  >
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {image ? image.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
                  </div>
                </label>
                <input id="image" type="file" accept="image/png,image/jpeg,image/webp" onChange={onImage} className="hidden" />
              </div>
              {errors.image && <p className="text-sm text-destructive mt-1">{errors.image}</p>}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => navigate("/dashboard/company")} className="flex-1">
                Cancel
              </Button>
              <Button variant="secondary" onClick={() => save("draft")} className="flex-1">
                Save as Draft
              </Button>
              <Button onClick={() => save("pending_review")} className="flex-1">
                Submit for Review
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddEditProperty;
