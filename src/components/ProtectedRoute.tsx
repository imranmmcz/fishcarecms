import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FishLoadingAnimation } from "@/components/FishLoadingAnimation";
import { logSecurityEvent } from "@/lib/securityLogger";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      logSecurityEvent({
        eventType: "unauthenticated_access_attempt",
        severity: "info",
        action: "route_access",
        details: { path: location.pathname },
      });
    } else if (requireAdmin && !isAdmin) {
      logSecurityEvent({
        eventType: "admin_route_denied",
        severity: "warning",
        action: "route_access",
        details: { path: location.pathname, user_id: user.id },
      });
    }
  }, [user, isAdmin, isLoading, requireAdmin, location.pathname]);

  if (isLoading) {
    return <FishLoadingAnimation message="যাচাই করা হচ্ছে..." />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
