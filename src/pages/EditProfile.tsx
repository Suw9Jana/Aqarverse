import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import logo from "@/assets/aqarverse-logo.jpeg";

// Mock user data - in real app, this would come from auth context
const mockUser = {
  role: 'customer' as 'customer' | 'company',
  fullName: 'Jane Customer',
  email: 'customer@example.com',
  phone: '+966501234567',
  location: '',
  licenseNumber: ''
};

const EditProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: mockUser.fullName,
    email: mockUser.email,
    phone: mockUser.phone,
    location: mockUser.location || '',
    licenseNumber: mockUser.licenseNumber || '',
    oldPassword: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Full Name validation
    const trimmedName = formData.fullName.trim().replace(/\s+/g, ' ');
    const nameParts = trimmedName.split(' ');
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
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = "Please enter a valid phone number.";
    } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      newErrors.phone = "Please enter a valid phone number.";
    }

    // Company-specific validations
    if (mockUser.role === 'company') {
      // Location validation
      if (!formData.location.trim()) {
        newErrors.location = "Please enter your location.";
      } else if (formData.location.trim().length < 2 || formData.location.trim().length > 100) {
        newErrors.location = "Please enter your location.";
      } else if (!/^[a-zA-Z0-9\s,'-]+$/.test(formData.location)) {
        newErrors.location = "Please enter your location.";
      }

      // License Number validation
      const licenseDigits = formData.licenseNumber.replace(/\D/g, '');
      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = "Please enter your license number.";
      } else if (licenseDigits.length < 5 || licenseDigits.length > 15) {
        newErrors.licenseNumber = "Please enter your license number.";
      }
    }

    // Password validation (only if user wants to change password)
    if (formData.password) {
      // Old password verification
      if (!formData.oldPassword) {
        newErrors.oldPassword = "Please enter your current password.";
      } else if (formData.oldPassword !== 'customer123' && formData.oldPassword !== 'company123') {
        newErrors.oldPassword = "Current password is incorrect.";
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        newErrors.password = "Password must be at least 8 characters and include uppercase, lowercase, a number and a special character.";
      }

      // Confirm Password validation
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      // Navigate back to dashboard
      if (mockUser.role === 'company') {
        navigate('/dashboard/company');
      } else {
        navigate('/dashboard/customer');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

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
            onClick={() => navigate(mockUser.role === 'company' ? '/dashboard/company' : '/dashboard/customer')}
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
            <CardDescription>
              Update your personal information
            </CardDescription>
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
                  className={errors.fullName ? 'border-destructive' : ''}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
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
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
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
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              {mockUser.role === 'company' && (
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
                      className={errors.location ? 'border-destructive' : ''}
                    />
                    {errors.location && (
                      <p className="text-sm text-destructive">{errors.location}</p>
                    )}
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
                      className={errors.licenseNumber ? 'border-destructive' : ''}
                    />
                    {errors.licenseNumber && (
                      <p className="text-sm text-destructive">{errors.licenseNumber}</p>
                    )}
                  </div>
                </>
              )}

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-4">Change Password (Optional)</h3>
                
                <div className="space-y-4">
                  {formData.password && (
                    <div className="space-y-2">
                      <Label htmlFor="oldPassword">Current Password *</Label>
                      <Input
                        id="oldPassword"
                        name="oldPassword"
                        type="password"
                        value={formData.oldPassword}
                        onChange={handleChange}
                        placeholder="Enter your current password"
                        className={errors.oldPassword ? 'border-destructive' : ''}
                      />
                      {errors.oldPassword && (
                        <p className="text-sm text-destructive">{errors.oldPassword}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current password"
                      className={errors.password ? 'border-destructive' : ''}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  {formData.password && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter your new password"
                        className={errors.confirmPassword ? 'border-destructive' : ''}
                      />
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                      )}
                    </div>
                  )}
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
