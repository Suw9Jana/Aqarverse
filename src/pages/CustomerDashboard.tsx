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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AqarVerse" className="h-10 w-10 object-contain rounded-lg" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">AqarVerse</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/profile/edit')} className="hover:bg-primary/10">
              <User className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="hover:bg-primary/10">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-3">
            My Favorites
          </h1>
          <p className="text-lg text-muted-foreground">Properties you've saved for later</p>
        </div>

        {favoriteProperties.length === 0 ? (
          <Card className="border-dashed border-2 bg-card/50 backdrop-blur-sm animate-fade-in">
            <CardContent className="py-16 text-center">
              <div className="inline-flex p-4 rounded-full bg-primary/10 mb-6">
                <Heart className="h-12 w-12 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">No favorite properties yet</p>
              <p className="text-muted-foreground">
                Start exploring and save properties you like
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {favoriteProperties.map((property, index) => (
              <Card 
                key={property.id} 
                className="group overflow-hidden hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border-primary/20 bg-card/80 backdrop-blur-sm hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {property.title}
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10 hover:scale-110 transition-transform"
                    >
                      <Heart className="h-5 w-5 fill-current" />
                    </Button>
                  </div>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <div className="p-1 rounded bg-primary/10">
                      <Building className="h-3.5 w-3.5 text-primary" />
                    </div>
                    {property.companyName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {property.description}
                  </p>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-sm p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-foreground">{property.location}</span>
                    </div>
                    
                    {property.size && (
                      <div className="flex items-center gap-3 text-sm p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
                        <Ruler className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-foreground">{property.size}</span>
                      </div>
                    )}
                    
                    {property.price && (
                      <div className="flex items-center gap-3 text-sm p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
                        <DollarSign className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-foreground font-semibold">{property.price}</span>
                      </div>
                    )}
                  </div>

                  <Button className="w-full mt-6 group-hover:shadow-lg group-hover:shadow-primary/50 transition-all">
                    View Details
                  </Button>
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
