import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { checking, isAdmin } = useAdmin();

  if (checking) {
    return <div className="p-8 text-center text-muted-foreground">Checking admin access…</div>;
  }
  if (!isAdmin) {
    // not admin → send to login (or anywhere you want)
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
