import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockProperties } from "@/data/mockData";
import { LogOut, User, Heart, MapPin, Ruler, DollarSign, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/aqarverse-logo.jpeg";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Mock favorite properties (approved properties only)
  const [favoriteProperties] = useState(
    mockProperties.filter(p => p.status === 'approved')
  );

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    setTimeout(() => navigate("/partners"), 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AqarVerse" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-primary">AqarVerse</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/profile/edit')}>
              <User className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Favorites</h1>
          <p className="text-muted-foreground">Properties you've saved for later</p>
        </div>

        {favoriteProperties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No favorite properties yet</p>
              <p className="text-sm text-muted-foreground">
                Start exploring and save properties you like
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {favoriteProperties.map((property) => (
              <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl">{property.title}</CardTitle>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Heart className="h-5 w-5 fill-current" />
                    </Button>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {property.companyName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {property.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-foreground">{property.location}</span>
                    </div>
                    
                    {property.size && (
                      <div className="flex items-center gap-2 text-sm">
                        <Ruler className="h-4 w-4 text-primary" />
                        <span className="text-foreground">{property.size}</span>
                      </div>
                    )}
                    
                    {property.price && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="text-foreground font-semibold">{property.price}</span>
                      </div>
                    )}
                  </div>

                  <Button className="w-full mt-4">View Details</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
