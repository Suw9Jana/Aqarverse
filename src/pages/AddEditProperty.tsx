import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload } from "lucide-react";
import logo from "@/assets/aqarverse_logo.jpg";

const AddEditProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: "",
    type: "",
    location: "",
    description: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Property Title validation
    const trimmedTitle = formData.title.trim().replace(/\s+/g, ' ');
    if (!trimmedTitle) {
      newErrors.title = "Please enter a valid property title.";
    } else if (trimmedTitle.length < 3 || trimmedTitle.length > 100) {
      newErrors.title = "Please enter a valid property title.";
    }
    
    // Property Type validation
    if (!formData.type) {
      newErrors.type = "Please select a property type.";
    }
    
    // Location validation
    const trimmedLocation = formData.location.trim();
    const locationRegex = /^[a-zA-Z0-9\s,\-]+$/;
    if (!trimmedLocation) {
      newErrors.location = "Please enter a valid location.";
    } else if (trimmedLocation.length < 2 || trimmedLocation.length > 100) {
      newErrors.location = "Please enter a valid location.";
    } else if (!locationRegex.test(trimmedLocation)) {
      newErrors.location = "Please enter a valid location.";
    }
    
    // Description validation
    const trimmedDescription = formData.description.trim();
    if (!trimmedDescription) {
      newErrors.description = "Please provide a description.";
    } else if (trimmedDescription.length < 20 || trimmedDescription.length > 1000) {
      newErrors.description = "Please provide a description.";
    }
    
    // File validation
    if (!isEdit && !file) {
      newErrors.file = "3D model file is required";
    } else if (file) {
      const validExtensions = ['.fbx', '.glb', '.gltf'];
      const fileName = file.name.toLowerCase();
      const isValid = validExtensions.some(ext => fileName.endsWith(ext));
      const maxSize = 50 * 1024 * 1024; // 50MB
      
      if (!isValid) {
        newErrors.file = "Unsupported file type. Please upload .fbx, .glb, or .gltf files.";
      } else if (file.size > maxSize) {
        newErrors.file = "File size exceeds 50MB limit.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrors({ ...errors, file: "" });
    }
  };

  const handleSave = () => {
    if (!validateForm()) return;

    toast({
      title: "Saved as Draft",
      description: "Your property has been saved.",
    });
    navigate("/dashboard/company");
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    toast({
      title: "Submitted for Review",
      description: "Your property has been submitted and is pending approval.",
    });
    navigate("/dashboard/company");
  };

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
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard/company")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Properties
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? "Edit Property" : "Add New Property"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="title">Property Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Luxury Marina Apartment"
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="type">Property Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
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
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Dubai Marina"
                className={errors.location ? "border-destructive" : ""}
              />
              {errors.location && <p className="text-sm text-destructive mt-1">{errors.location}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the property..."
                rows={4}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <Label htmlFor="model">3D Model (.fbx, .glb, .gltf)</Label>
              <div className="mt-2">
                <label htmlFor="model" className="cursor-pointer">
                  <div className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors ${errors.file ? "border-destructive" : "border-border"}`}>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {file ? file.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum file size: 50MB
                    </p>
                  </div>
                </label>
                <input
                  id="model"
                  type="file"
                  accept=".fbx,.glb,.gltf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              {errors.file && <p className="text-sm text-destructive mt-1">{errors.file}</p>}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard/company")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleSave}
                className="flex-1"
              >
                Save as Draft
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
              >
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
