import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth, roleHome, type AppRole } from "@/hooks/use-auth";

interface Props {
  allow: AppRole[];
}

export function RequireRole({ allow }: Props) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (!role || !allow.includes(role)) {
    return <Navigate to={roleHome(role)} replace />;
  }

  return <Outlet />;
}
