import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "customer" as "customer" | "company" | "admin",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mock validation - in real app would check against backend
    const mockUsers = [
      { email: "company@example.com", password: "password123", role: "company" },
      { email: "admin@example.com", password: "admin123", role: "admin" },
    ];

    const user = mockUsers.find(
      (u) => u.email === formData.email && u.password === formData.password && u.role === formData.role
    );

    if (user) {
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      
      setTimeout(() => {
        if (user.role === "company") {
          navigate("/dashboard/company");
        } else {
          navigate("/dashboard/admin");
        }
      }, 1000);
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid email or password.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>Sign in to your AqarVerse account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>I am a</Label>
                  <RadioGroup
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value as "customer" | "company" | "admin" })}
                    className="flex flex-col space-y-2 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="customer" id="customer" />
                      <Label htmlFor="customer" className="font-normal cursor-pointer">
                        Customer
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="company" id="company" />
                      <Label htmlFor="company" className="font-normal cursor-pointer">
                        Real Estate Company
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="admin" id="admin" />
                      <Label htmlFor="admin" className="font-normal cursor-pointer">
                        Platform Administrator
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Sign In
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                  {formData.role === "admin" 
                    ? "Admin: admin@example.com / admin123"
                    : formData.role === "company"
                    ? "Company: company@example.com / password123"
                    : "Don't have an account? Register first"}
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Login;
