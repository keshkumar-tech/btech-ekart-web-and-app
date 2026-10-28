// Route guards: require login, and optionally require the admin role.
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { Skeleton } from "@/components/ui";

export function RequireAuth() {
  const { isAuthenticated, initialized } = useAuth();
  const location = useLocation();

  if (!initialized) return <PageLoader />;
  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { isAuthenticated, isAdmin, initialized } = useAuth();
  const location = useLocation();

  if (!initialized) return <PageLoader />;
  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!isAdmin) {
    return (
      <div className="container-app py-20 text-center">
        <h1 className="text-2xl font-bold">403 — Admins only</h1>
        <p className="mt-2 text-gray-500">
          You don't have permission to view this page.
        </p>
      </div>
    );
  }
  return <Outlet />;
}

function PageLoader() {
  return (
    <div className="container-app space-y-4 py-16">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
