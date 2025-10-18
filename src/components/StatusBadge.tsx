// src/components/StatusBadge.tsx
import { cn } from "@/lib/utils";

type KnownStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "submitted" // legacy value mapped to "pending"
  | "unknown";

const variants: Record<KnownStatus, { label: string; className: string }> = {
  draft:          { label: "Draft",   className: "bg-muted text-foreground" },
  pending_review: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  approved:       { label: "Approved",className: "bg-emerald-100 text-emerald-800" },
  rejected:       { label: "Rejected",className: "bg-red-100 text-red-800" },
  submitted:      { label: "Pending", className: "bg-amber-100 text-amber-800" },
  unknown:        { label: "Unknown", className: "bg-gray-200 text-gray-700" },
};

function StatusBadge({
  status,
  className,
}: {
  status?: string;
  className?: string;
}) {
  const key = (status as KnownStatus) ?? "unknown";
  const v = variants[key] ?? variants.unknown;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        v.className,
        className
      )}
    >
      {v.label}
    </span>
  );
}

export { StatusBadge };   // named export
export default StatusBadge; // default export (so both styles work)
