import { Company } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";

interface CompanyCardProps {
  company: Company;
}

export const CompanyCard = ({ company }: CompanyCardProps) => {
  return (
    <Card 
      className="group relative overflow-hidden border-border/50 transition-all duration-500 hover:-translate-y-3 hover:border-primary/40 cursor-pointer animate-fade-in backdrop-blur-sm"
      style={{ 
        boxShadow: 'var(--shadow-elegant)',
        background: 'var(--gradient-card)'
      }}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, hsl(45 100% 65% / 0.2), hsl(43 100% 75% / 0.2))' }}></div>
      
      {/* Animated border glow */}
      <div className="absolute -inset-[1px] rounded-[calc(var(--radius)+1px)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" style={{ background: 'var(--gradient-accent)' }}></div>
      
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at top right, hsl(45 100% 70% / 0.3), transparent 70%)' }}></div>
      
      <CardContent className="p-8 relative">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-500 ease-out border border-primary/10 group-hover:border-primary/30">
              {company.logo ? (
                <img 
                  src={company.logo} 
                  alt={company.name} 
                  className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <Building2 className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
              )}
            </div>
            {/* Glow effect behind logo */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" style={{ background: 'var(--gradient-accent)' }}></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl text-card-foreground mb-2 group-hover:text-primary transition-colors duration-300 truncate leading-tight">
              {company.name}
            </h3>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary/60 group-hover:bg-primary group-hover:shadow-glow transition-all duration-300"></div>
              <p className="text-sm text-muted-foreground group-hover:text-foreground/80 font-medium tracking-wide transition-colors duration-300">
                {company.city}
              </p>
            </div>
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
