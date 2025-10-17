import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Property } from "@/types";
import { mockProperties } from "@/data/mockData";
import { Edit, Trash2, Eye, Send, Plus, LogOut, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/aqarverse-logo.jpeg";

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>(
    mockProperties.filter(p => p.companyId === '1') // Mock current company ID
  );

  const handleDelete = (id: string) => {
    setProperties(properties.filter(p => p.id !== id));
    toast({
      title: "Property Deleted",
      description: "The property has been removed.",
    });
  };

  const handleSubmit = (id: string) => {
    setProperties(properties.map(p => 
      p.id === id ? { ...p, status: 'submitted', submittedAt: new Date() } : p
    ));
    toast({
      title: "Property Submitted",
      description: "Your property has been submitted for review.",
    });
  };

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
            <Button variant="ghost" onClick={() => navigate('/profile/edit?role=company')}>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Properties</h1>
            <p className="text-muted-foreground">Manage your property listings</p>
          </div>
          <Link to="/dashboard/company/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </Link>
        </div>

        {properties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No properties yet</p>
              <Link to="/dashboard/company/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Property
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.title}</TableCell>
                    <TableCell>{property.type}</TableCell>
                    <TableCell>{property.location}</TableCell>
                    <TableCell>
                      <StatusBadge status={property.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/dashboard/company/edit/${property.id}`)}
                          disabled={property.status === 'approved'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {property.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSubmit(property.id)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(property.id)}
                          disabled={property.status === 'approved'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {properties.some(p => p.status === 'rejected') && (
          <Card className="mt-6 border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Rejected Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {properties
                .filter(p => p.status === 'rejected')
                .map(property => (
                  <div key={property.id} className="p-4 bg-destructive/5 rounded-lg">
                    <p className="font-medium mb-2">{property.title}</p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Reason:</strong> {property.rejectionReason}
                    </p>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboard;
