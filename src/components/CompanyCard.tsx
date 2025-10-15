import { Company } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";

interface CompanyCardProps {
  company: Company;
}

export const CompanyCard = ({ company }: CompanyCardProps) => {
  return (
    <Card 
      className="group relative overflow-hidden border-border/40 transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 cursor-pointer animate-fade-in"
      style={{ 
        boxShadow: 'var(--shadow-elegant)',
        background: 'var(--gradient-card)'
      }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, hsl(195 85% 55% / 0.05), hsl(280 85% 65% / 0.05))' }}></div>
      <div className="absolute -inset-px rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'var(--gradient-accent)', padding: '1px', zIndex: -1 }}></div>
      
      <CardContent className="p-8 relative">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-xl overflow-hidden bg-muted/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500 ease-out">
            {company.logo ? (
              <img 
                src={company.logo} 
                alt={company.name} 
                className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <Building2 className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-xl text-card-foreground mb-2 group-hover:text-primary transition-colors duration-300 truncate">
              {company.name}
            </h3>
            <p className="text-sm text-muted-foreground font-light tracking-wide">{company.city}</p>
          </div>
        </div>
      </CardContent>
      
      <style>{`
        .group:hover {
          box-shadow: var(--shadow-hover);
        }
      `}</style>
    </Card>
  );
};
