import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { UserRole } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isInitializing, user } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--color-bg)">
        <div
          className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-(--color-indigo)"
          role="status"
          aria-label="טוען"
        />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

interface RoleGateProps {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { hasRole } = useAuth();
  return hasRole(...roles) ? children : fallback;
}
