import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockProperties } from "@/data/mockData";
import { LogOut, User, Heart, MapPin, Ruler, DollarSign, Building, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/aqarverse-logo.jpeg";
import { Badge } from "@/components/ui/badge";

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
      {/* Premium Navigation */}
      <nav className="border-b bg-card backdrop-blur-sm sticky top-0 z-50" style={{ boxShadow: 'var(--shadow-elegant)' }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AqarVerse" className="h-10 w-10 object-contain rounded-lg" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              AqarVerse
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/profile/edit')}
              className="hover:bg-accent/10 transition-all duration-300"
            >
              <User className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="hover:bg-destructive/10 transition-all duration-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Gradient */}
      <div 
        className="relative overflow-hidden"
        style={{ 
          background: 'var(--gradient-hero)',
        }}
      >
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              <Badge variant="secondary" className="text-sm font-medium">
                Premium Member
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Welcome Back!
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Your personalized collection of dream properties awaits
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <Card className="backdrop-blur-sm bg-card/90" style={{ boxShadow: 'var(--shadow-elegant)' }}>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {favoriteProperties.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Favorites</div>
                </CardContent>
              </Card>
              <Card className="backdrop-blur-sm bg-card/90" style={{ boxShadow: 'var(--shadow-elegant)' }}>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-accent mb-1">0</div>
                  <div className="text-xs text-muted-foreground">Visits</div>
                </CardContent>
              </Card>
              <Card className="backdrop-blur-sm bg-card/90" style={{ boxShadow: 'var(--shadow-elegant)' }}>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-secondary mb-1">0</div>
                  <div className="text-xs text-muted-foreground">Inquiries</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Your Saved Properties</h2>
          <p className="text-muted-foreground">Curated collection of your favorite finds</p>
        </div>

        {favoriteProperties.length === 0 ? (
          <Card className="border-2 border-dashed" style={{ boxShadow: 'var(--shadow-elegant)' }}>
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                <Heart className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No favorites yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start exploring our amazing properties and save the ones you love
              </p>
              <Button 
                size="lg"
                onClick={() => navigate('/partners')}
                className="relative overflow-hidden group"
              >
                <span className="relative z-10">Explore Properties</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {favoriteProperties.map((property) => (
              <Card 
                key={property.id} 
                className="group overflow-hidden border-0 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                style={{ 
                  boxShadow: 'var(--shadow-elegant)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-elegant)';
                }}
              >
                {/* Property Image Placeholder with Gradient */}
                <div 
                  className="h-48 relative overflow-hidden"
                  style={{ background: 'var(--gradient-card)' }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building className="h-16 w-16 text-primary/20" />
                  </div>
                  <Badge 
                    className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm"
                  >
                    {property.type}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm hover:bg-card text-destructive hover:scale-110 transition-all"
                  >
                    <Heart className="h-5 w-5 fill-current" />
                  </Button>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
                    {property.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {property.companyName}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {property.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-foreground">{property.location}</span>
                    </div>
                    
                    {property.size && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/10">
                          <Ruler className="h-4 w-4 text-secondary" />
                        </div>
                        <span className="text-foreground">{property.size}</span>
                      </div>
                    )}
                    
                    {property.price && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10">
                          <DollarSign className="h-4 w-4 text-accent" />
                        </div>
                        <span className="text-foreground font-bold text-lg">
                          {property.price}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                    variant="outline"
                  >
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
