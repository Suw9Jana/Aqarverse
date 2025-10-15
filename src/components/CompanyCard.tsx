import { Company } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";

interface CompanyCardProps {
  company: Company;
}

export const CompanyCard = ({ company }: CompanyCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            {company.logo ? (
              <img 
                src={company.logo} 
                alt={company.name} 
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-card-foreground mb-1">
              {company.name}
            </h3>
            <p className="text-sm text-muted-foreground">{company.city}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
