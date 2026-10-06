import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/hooks/useAuth";

function AuthLoading() {
  return (
    <div className="bg-paper px-6 py-16">
      <LoadingState label="Checking session" />
    </div>
  );
}

export function RequireAuth({ children, loginPath = "/login" }: { children: ReactNode; loginPath?: string }) {
  const location = useLocation();
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return <AuthLoading />;
  }
  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }
  return children;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, isReady, roles } = useAuth();
  const allowed = roles.includes("ADMIN") || roles.includes("STAFF");

  if (!isReady) {
    return <AuthLoading />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!allowed) {
    return <Navigate to="/account" replace />;
  }
  return children;
}
