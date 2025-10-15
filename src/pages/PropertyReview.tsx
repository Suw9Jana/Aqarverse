import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mockProperties } from "@/data/mockData";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/aqarverse-logo.jpeg";

const PropertyReview = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  
  const property = mockProperties.find(p => p.id === id);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Property not found</p>
            <Button onClick={() => navigate("/dashboard/admin")} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleApprove = () => {
    toast({
      title: "Property Approved",
      description: `${property.title} has been approved successfully.`,
    });
    navigate("/dashboard/admin");
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setReasonError("Rejection reason is required");
      return;
    }

    toast({
      title: "Property Rejected",
      description: `${property.title} has been rejected.`,
      variant: "destructive",
    });
    setShowRejectModal(false);
    navigate("/dashboard/admin");
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AqarVerse" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-primary">AqarVerse Admin</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard/admin")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Review Queue
        </Button>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{property.title}</CardTitle>
                  <p className="text-muted-foreground">{property.companyName}</p>
                </div>
                <StatusBadge status={property.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground">Property Type</Label>
                  <p className="text-lg font-medium">{property.type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="text-lg font-medium">{property.location}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-2">{property.description}</p>
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">3D Model Preview</Label>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <img 
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=450&fit=crop" 
                    alt="3D Model Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Mock 3D model preview - In production, this would show the actual uploaded model
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <p>{new Date(property.createdAt).toLocaleDateString()}</p>
                </div>
                {property.submittedAt && (
                  <div>
                    <Label className="text-muted-foreground">Submitted At</Label>
                    <p>{new Date(property.submittedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {property.status === 'submitted' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => setShowRejectModal(true)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Property
                  </Button>
                  <Button
                    onClick={handleApprove}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Property
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Property</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this property. This will be visible to the company.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                setReasonError("");
              }}
              placeholder="Explain why this property is being rejected..."
              rows={4}
              className={`mt-2 ${reasonError ? "border-destructive" : ""}`}
            />
            {reasonError && (
              <p className="text-sm text-destructive mt-1">{reasonError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyReview;
