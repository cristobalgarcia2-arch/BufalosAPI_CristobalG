import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner text="Comprobando autorización..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirige al login guardando la ruta previa
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const allowed = roles.some((r) => hasRole(r));
    if (!allowed) {
      // Redirige a la página de acceso denegado (HTTP 403 Forbidden)
      return <Navigate to="/acceso-denegado" replace />;
    }
  }

  return <>{children}</>;
};
