import { PropertyStatus } from "@/types";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: PropertyStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const variants: Record<PropertyStatus, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-muted text-muted-foreground hover:bg-muted' },
    submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
    approved: { label: 'Approved', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
  };

  const { label, className } = variants[status];

  return (
    <Badge className={className}>
      {label}
    </Badge>
  );
};
