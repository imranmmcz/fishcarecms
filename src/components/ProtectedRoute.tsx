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
  const { user, isLoading, roleLoading, isAdmin } = useAuth();
  const location = useLocation();

  // Defense-in-depth: ANY route under /admin requires admin, even if a caller
  // forgot to pass requireAdmin. This is the strict middleware guard.
  const isAdminPath = location.pathname.startsWith("/admin");
  const mustBeAdmin = requireAdmin || isAdminPath;

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      logSecurityEvent({
        eventType: "unauthenticated_access_attempt",
        severity: "info",
        action: "route_access",
        details: { path: location.pathname },
      });
    } else if (!roleLoading && mustBeAdmin && !isAdmin) {
      logSecurityEvent({
        eventType: "admin_route_denied",
        severity: "warning",
        action: "route_access",
        details: { path: location.pathname, user_id: user.id, role_seen: "non-admin" },
      });
    }
  }, [user, isAdmin, isLoading, roleLoading, mustBeAdmin, location.pathname]);

  // Wait for both the session AND the role lookup before deciding.
  // Without this, an admin could be bounced to /dashboard while the role
  // is still being fetched.
  if (isLoading || (user && roleLoading)) {
    return <FishLoadingAnimation message="যাচাই করা হচ্ছে..." />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (mustBeAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
